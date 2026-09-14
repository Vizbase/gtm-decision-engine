import subprocess
import sys
from pathlib import Path


def test_golden_decision_policy():
    project_root = (
        Path(__file__)
        .resolve()
        .parents[3]
    )

    result = subprocess.run(
        [
            sys.executable,
            "scripts/evaluate_golden_set.py",
        ],
        cwd=project_root,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, (
        result.stdout
        + "\n"
        + result.stderr
    )
