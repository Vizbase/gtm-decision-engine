from services.api.app.services.decision_engine import make_decision


def test_high_fit_high_confidence():
    result = make_decision(
        icp_score=90,
        data_confidence=90,
    )

    assert result.recommended_action.value == "work_now"


def test_high_fit_low_confidence():
    result = make_decision(
        icp_score=90,
        data_confidence=40,
    )

    assert result.recommended_action.value == "research_first"


def test_medium_fit():
    result = make_decision(
        icp_score=60,
        data_confidence=90,
    )

    assert result.recommended_action.value == "nurture"


def test_low_fit():
    result = make_decision(
        icp_score=30,
        data_confidence=90,
    )

    assert result.recommended_action.value == "deprioritize"
