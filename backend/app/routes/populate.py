from fastapi import APIRouter, BackgroundTasks

from ..schemas import PopulateOptions, StatusResponse, PopulationStatus
from ..services.populate_service import PopulateService
from ..services.deduplicate_service import DeduplicateService

router = APIRouter(prefix="/populate", tags=["populate"])

# Instância global do serviço
_service = PopulateService()


def _run_extraction_task(options: PopulateOptions):
    """Task de background para extração."""
    _service.run_wikidata_extraction(
        continents=options.continents,
        start_year=options.start_year,
        end_year=options.end_year
    )
    # Deduplicação após extração
    DeduplicateService().run()


def _run_seed_task():
    """Task de background para seed."""
    _service.run_seed()
    DeduplicateService().run()


@router.post("", response_model=StatusResponse)
def start_populate(
    options: PopulateOptions,
    background_tasks: BackgroundTasks
):
    """Inicia extração da Wikidata."""
    if _service.status["is_running"]: 
        return StatusResponse(status="busy", message="Processo já em execução")

    _service.reset()
    background_tasks.add_task(_run_extraction_task, options)
    
    return StatusResponse(status="started")


@router.post("/seed", response_model=StatusResponse)
def start_seed(background_tasks: BackgroundTasks):
    """Inicia carga de dados pré-definidos."""
    if _service.status["is_running"]: 
        return StatusResponse(status="busy", message="Processo já em execução")

    _service.reset()
    background_tasks.add_task(_run_seed_task)
    
    return StatusResponse(status="started")


@router.get("/status", response_model=PopulationStatus)
def get_status():
    """Retorna status da população."""
    return PopulationStatus(**_service.status)


@router.post("/stop", response_model=StatusResponse)
def stop_populate():
    """Para a população em andamento."""
    _service.request_stop()
    return StatusResponse(status="stopping", message="Parada solicitada")