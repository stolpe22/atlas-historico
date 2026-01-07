from sqlalchemy.orm import Session
from app.models.integrations import IntegrationDefinition

def seed_integrations(db: Session):
    """Popula as integrações suportadas pelo sistema."""
    
    definitions = [
    #     {
    #         "slug": "seed",
    #         "name": "Restaurar Banco Local",
    #         "description": "Restaura eventos a partir do arquivo JSON local.",
    #         "logo_url": "https://cdn-icons-png.flaticon.com/512/620/620851.png",
    #         "form_schema": [] # Schema vazio = não precisa de formulário de senha
    #     },
        {
            "slug": "kaggle",
            "name": "Kaggle Datasets",
            "description": "Importação de datasets históricos massivos.",
            "logo_url": "https://www.kaggle.com/static/images/site-logo.svg",
            "form_schema": [
                {
                    "key": "api_key",
                    "label": "API Token (Key)",
                    "type": "password",
                    "required": True,
                    "placeholder": "KGAT_..."
                }
            ]
        },
        # {
        #     "slug": "openai",
        #     "name": "OpenAI GPT-4",
        #     "description": "Enriquecimento de dados com IA.",
        #     "logo_url": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
        #     "form_schema": [
        #         {
        #             "key": "api_key",
        #             "label": "OpenAI API Key",
        #             "type": "password",
        #             "required": True,
        #             "placeholder": "sk-..."
        #         }
        #     ]
        # }
    ]

    for data in definitions:
        exists = db.query(IntegrationDefinition).filter_by(slug=data["slug"]).first()
        if not exists:
            new_def = IntegrationDefinition(**data)
            db.add(new_def)
            print(f"➕ Integração adicionada: {data['name']}")
        else:
            # Atualiza schema se mudou
            exists.form_schema = data["form_schema"]
            exists.name = data["name"]
    
    db.commit()