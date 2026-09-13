from unittest.mock import MagicMock

from services.api.app.repositories.analysis_repository import (
    AnalysisRepository,
)


def test_repository_rolls_back_on_failure():
    db = MagicMock()

    repository = AnalysisRepository(db)

    repository.get_or_create_workspace = MagicMock(
        side_effect=RuntimeError("database error")
    )

    try:
        repository.save_analysis(
            workspace_name="Test Workspace",
            icp=MagicMock(),
            results=[],
        )
    except RuntimeError:
        pass

    db.rollback.assert_called_once()
