from sqlalchemy.orm import Session
from sqlalchemy import text
from ..models import HistoricalEvent

class DeduplicateService:
    def __init__(self, db: Session):
        self.db = db

    def run(self):
        """
        Remove duplicatas exatas (mesmo nome e ano) usando SQL nativo.
        Isso é muito mais rápido que processar um por um em Python.
        """
        sql = text("""
            DELETE FROM events a USING events b
            WHERE a.id < b.id
            AND a.name = b.name
            AND a.year_start = b.year_start
            AND a.source != 'manual'; -- Protege dados inseridos manualmente
        """)
        result = self.db.execute(sql)
        self.db.commit()
        return result.rowcount