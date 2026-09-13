from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from services.api.app.models.entities import (
    AnalysisResult,
    AnalysisRun,
    Company,
    Workspace,
)
from services.api.app.schemas.analysis import CompanyAnalysisResult
from services.api.app.schemas.scoring import ICPProfile


class AnalysisRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_workspace(
        self,
        name: str,
    ) -> Workspace:
        workspace = self.db.scalar(
            select(Workspace).where(
                Workspace.name == name
            )
        )

        if workspace:
            return workspace

        workspace = Workspace(name=name)
        self.db.add(workspace)
        self.db.flush()

        return workspace

    def get_or_create_company(
        self,
        workspace: Workspace,
        result: CompanyAnalysisResult,
    ) -> Company:
        company_data = result.company

        company = None

        if company_data.domain:
            company = self.db.scalar(
                select(Company).where(
                    Company.workspace_id == workspace.id,
                    Company.domain == company_data.domain,
                    Company.name == company_data.name,
                )
            )
        else:
            company = self.db.scalar(
                select(Company).where(
                    Company.workspace_id == workspace.id,
                    Company.domain.is_(None),
                    Company.name == company_data.name,
                )
            )

        if company:
            self._update_company(company, result)
            return company

        company = Company(
            workspace_id=workspace.id,
            name=company_data.name,
            domain=company_data.domain,
            website=company_data.website,
            country=company_data.country,
            industry=company_data.industry,
            employee_count=company_data.employee_count,
            linkedin_url=company_data.linkedin_url,
        )

        self.db.add(company)
        self.db.flush()

        return company

    def create_analysis_run(
        self,
        workspace: Workspace,
        icp: ICPProfile,
    ) -> AnalysisRun:
        analysis_run = AnalysisRun(
            workspace_id=workspace.id,
            icp_config=icp.model_dump(mode="json"),
        )

        self.db.add(analysis_run)
        self.db.flush()

        return analysis_run

    def create_analysis_result(
        self,
        analysis_run: AnalysisRun,
        company: Company,
        result: CompanyAnalysisResult,
    ) -> AnalysisResult:
        analysis_result = AnalysisResult(
            analysis_run_id=analysis_run.id,
            company_id=company.id,
            rank=result.rank,
            icp_score=result.icp_score,
            signal_score=result.signal_score,
            priority_score=result.priority_score,
            data_confidence=result.data_confidence,
            crm_status=result.crm_status,
            recommended_action=result.recommended_action,
            action_reason=result.action_reason,
            enrichment=result.enrichment.model_dump(mode="json"),
            details={
                "fit_level": result.fit_level,
                "signal_level": result.signal_level,
                "priority_level": result.priority_level,
                "confidence_level": result.confidence_level,
                "crm_source": result.crm_source,
                "reasons": result.reasons,
                "signal_reasons": result.signal_reasons,
                "confidence_reasons": result.confidence_reasons,
            },
        )

        self.db.add(analysis_result)

        return analysis_result

    def save_analysis(
        self,
        workspace_name: str,
        icp: ICPProfile,
        results: list[CompanyAnalysisResult],
    ) -> AnalysisRun:
        try:
            workspace = self.get_or_create_workspace(
                workspace_name
            )

            analysis_run = self.create_analysis_run(
                workspace=workspace,
                icp=icp,
            )

            for result in results:
                company = self.get_or_create_company(
                    workspace=workspace,
                    result=result,
                )

                self.create_analysis_result(
                    analysis_run=analysis_run,
                    company=company,
                    result=result,
                )

            self.db.commit()
            self.db.refresh(analysis_run)

            return analysis_run

        except Exception:
            self.db.rollback()
            raise

    def list_analysis_runs(
        self,
        limit: int = 20,
    ):
        statement = (
            select(
                AnalysisRun,
                Workspace.name,
                func.count(AnalysisResult.id),
            )
            .join(
                Workspace,
                Workspace.id == AnalysisRun.workspace_id,
            )
            .outerjoin(
                AnalysisResult,
                AnalysisResult.analysis_run_id == AnalysisRun.id,
            )
            .group_by(
                AnalysisRun.id,
                Workspace.name,
            )
            .order_by(
                AnalysisRun.created_at.desc()
            )
            .limit(limit)
        )

        return self.db.execute(statement).all()

    def get_analysis_run(
        self,
        run_id: UUID,
    ):
        run_statement = (
            select(
                AnalysisRun,
                Workspace.name,
            )
            .join(
                Workspace,
                Workspace.id == AnalysisRun.workspace_id,
            )
            .where(
                AnalysisRun.id == run_id
            )
        )

        run_row = self.db.execute(
            run_statement
        ).first()

        if not run_row:
            return None

        results_statement = (
            select(
                AnalysisResult,
                Company,
            )
            .join(
                Company,
                Company.id == AnalysisResult.company_id,
            )
            .where(
                AnalysisResult.analysis_run_id == run_id
            )
            .order_by(
                AnalysisResult.rank.asc()
            )
        )

        result_rows = self.db.execute(
            results_statement
        ).all()

        return run_row, result_rows

    @staticmethod
    def _update_company(
        company: Company,
        result: CompanyAnalysisResult,
    ) -> None:
        data = result.company

        company.name = data.name
        company.website = data.website
        company.country = data.country
        company.industry = data.industry
        company.employee_count = data.employee_count
        company.linkedin_url = data.linkedin_url
