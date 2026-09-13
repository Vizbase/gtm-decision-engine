from services.api.app.schemas.crm import CRMContext, CRMStatus
from services.api.app.services.decision_engine import make_decision


def test_high_fit_high_confidence():
    result = make_decision(90, 90)

    assert result.recommended_action.value == "work_now"


def test_high_fit_low_confidence():
    result = make_decision(90, 40)

    assert result.recommended_action.value == "research_first"


def test_medium_fit():
    result = make_decision(60, 90)

    assert result.recommended_action.value == "nurture"


def test_low_fit():
    result = make_decision(30, 90)

    assert result.recommended_action.value == "deprioritize"


def test_existing_customer():
    context = CRMContext(
        status=CRMStatus.EXISTING_CUSTOMER
    )

    result = make_decision(95, 95, context)

    assert result.recommended_action.value == "expansion"


def test_open_opportunity():
    context = CRMContext(
        status=CRMStatus.OPEN_OPPORTUNITY
    )

    result = make_decision(95, 95, context)

    assert result.recommended_action.value == "continue_opportunity"


def test_recently_contacted():
    context = CRMContext(
        status=CRMStatus.RECENTLY_CONTACTED
    )

    result = make_decision(95, 95, context)

    assert result.recommended_action.value == "pause_outreach"


def test_existing_high_fit_lead():
    context = CRMContext(
        status=CRMStatus.EXISTING_LEAD
    )

    result = make_decision(95, 95, context)

    assert result.recommended_action.value == "follow_up_existing"
