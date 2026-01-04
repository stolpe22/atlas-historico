from typing import Optional


def calculate_period(year: int) -> str:
    """Calcula o período histórico baseado no ano."""
    if year < -4000:
        return "Pré-História"
    if year < 476:
        return "Idade Antiga"
    if year < 1453:
        return "Idade Média"
    if year < 1789:
        return "Idade Moderna"
    return "Idade Contemporânea"


def format_year_display(year: int) -> str:
    """Formata ano para exibição (a.C. / d.C.)."""
    if year < 0:
        return f"{abs(year)} a.C."
    return str(year)


def parse_wikidata_year(date_str: str) -> Optional[int]: 
    """Extrai ano de string de data Wikidata."""
    if not date_str: 
        return None
    try:
        if date_str.startswith('-'):
            return int(date_str[0:5])
        return int(date_str[0:4])
    except (ValueError, IndexError):
        return None


def parse_wikidata_coordinates(coord_str:  str) -> Optional[tuple[float, float]]: 
    """Extrai lat/lon de string de coordenadas Wikidata."""
    if not coord_str:
        return None
    try: 
        clean = coord_str.replace("Point(", "").replace(")", "")
        lon, lat = clean.split(" ")
        return float(lat), float(lon)
    except (ValueError, IndexError):
        return None