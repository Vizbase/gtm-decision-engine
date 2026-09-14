import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.api.app.schemas.crm import (
    CRMContext,
    CRMStatus,
)
from services.api.app.schemas.enrichment import (
    WebsiteEnrichment,
)
from services.api.app.services.decision_engine import (
    make_decision,
)
from services.api.app.services.priority_engine import (
    calculate_priority_score,
)
from services.api.app.services.signal_scorer import (
    calculate_signal_score,
)


GOLDEN_PATH = (
    ROOT
    / "data"
    / "evaluation"
    / "golden_decision_set.json"
)


def load_golden_set():
    return json.loads(
        GOLDEN_PATH.read_text(
            encoding="utf-8"
        )
    )


def evaluate_signal_case(case):
    enrichment = WebsiteEnrichment(
        source="golden_evaluation",
        requested_url="https://golden.example",
        reachable=case["reachable"],
        status_code=(
            200
            if case["reachable"]
            else None
        ),
        detected_technologies=[
            f"Technology {index + 1}"
            for index in range(
                case["technology_count"]
            )
        ],
        signal_keywords=[
            f"Signal {index + 1}"
            for index in range(
                case["keyword_count"]
            )
        ],
        hiring_signal=case["hiring_signal"],
        error=(
            None
            if case["reachable"]
            else "Golden scenario: unavailable"
        ),
    )

    result = calculate_signal_score(
        enrichment
    )

    failures = []

    if result.score != case["expected_score"]:
        failures.append(
            f"signal score expected "
            f"{case['expected_score']}, "
            f"got {result.score}"
        )

    if result.level != case["expected_level"]:
        failures.append(
            f"signal level expected "
            f"{case['expected_level']}, "
            f"got {result.level}"
        )

    return failures


def evaluate_decision_case(case):
    signal_for_priority = (
        case["signal_score"]
        if case["enrichment_available"]
        is not False
        else None
    )

    icp_for_priority = (
        case["icp_score"]
        if case["icp_configured"]
        else None
    )

    priority_score, priority_level = (
        calculate_priority_score(
            icp_score=icp_for_priority,
            signal_score=signal_for_priority,
            data_confidence=(
                case["data_confidence"]
            ),
        )
    )

    decision = make_decision(
        icp_score=case["icp_score"],
        data_confidence=(
            case["data_confidence"]
        ),
        crm_context=CRMContext(
            status=CRMStatus(
                case["crm_status"]
            ),
            source="golden_evaluation",
        ),
        signal_score=case["signal_score"],
        enrichment_available=(
            case["enrichment_available"]
        ),
        icp_configured=(
            case["icp_configured"]
        ),
    )

    failures = []

    if (
        priority_score
        != case["expected_priority_score"]
    ):
        failures.append(
            f"priority score expected "
            f"{case['expected_priority_score']}, "
            f"got {priority_score}"
        )

    if (
        priority_level
        != case["expected_priority_level"]
    ):
        failures.append(
            f"priority level expected "
            f"{case['expected_priority_level']}, "
            f"got {priority_level}"
        )

    actual_action = (
        decision.recommended_action.value
    )

    if actual_action != case["expected_action"]:
        failures.append(
            f"action expected "
            f"{case['expected_action']}, "
            f"got {actual_action}"
        )

    return failures, actual_action


def evaluate_golden_set(verbose=True):
    data = load_golden_set()

    signal_failures = []
    decision_failures = []

    signal_passed = 0
    decision_passed = 0

    action_coverage = Counter()

    for case in data["signal_cases"]:
        failures = evaluate_signal_case(
            case
        )

        if failures:
            signal_failures.append(
                (case, failures)
            )
        else:
            signal_passed += 1

    for case in data["decision_cases"]:
        failures, actual_action = (
            evaluate_decision_case(case)
        )

        action_coverage[
            actual_action
        ] += 1

        if failures:
            decision_failures.append(
                (case, failures)
            )
        else:
            decision_passed += 1

    total_signal = len(
        data["signal_cases"]
    )

    total_decisions = len(
        data["decision_cases"]
    )

    total = total_signal + total_decisions
    passed = signal_passed + decision_passed

    if verbose:
        print()
        print(
            "GTM Decision Engine "
            "Golden Evaluation"
        )
        print("=" * 42)

        print(
            f"Signal scoring: "
            f"{signal_passed}/{total_signal} passed"
        )

        print(
            f"Decision policy: "
            f"{decision_passed}/{total_decisions} passed"
        )

        print(
            f"Overall policy conformance: "
            f"{passed}/{total} "
            f"({passed / total * 100:.1f}%)"
        )

        print()
        print("Recommended-action coverage:")

        for action in sorted(
            action_coverage
        ):
            print(
                f"  {action}: "
                f"{action_coverage[action]}"
            )

        if (
            signal_failures
            or decision_failures
        ):
            print()
            print("FAILURES")
            print("-" * 42)

        for case, failures in signal_failures:
            print(
                f"\n[Signal] {case['id']}"
            )
            print(
                f"  Policy: {case['reason']}"
            )

            for failure in failures:
                print(
                    f"  - {failure}"
                )

        for case, failures in decision_failures:
            print(
                f"\n[Decision] {case['id']}"
            )
            print(
                f"  Policy: {case['reason']}"
            )

            for failure in failures:
                print(
                    f"  - {failure}"
                )

        print()
        print(
            "Important: this is policy "
            "conformance, not real-world "
            "sales predictive accuracy."
        )
        print()

    return {
        "passed": passed,
        "total": total,
        "signal_passed": signal_passed,
        "signal_total": total_signal,
        "decision_passed": decision_passed,
        "decision_total": total_decisions,
        "signal_failures": signal_failures,
        "decision_failures": decision_failures,
    }


if __name__ == "__main__":
    result = evaluate_golden_set()

    if (
        result["signal_failures"]
        or result["decision_failures"]
    ):
        raise SystemExit(1)
