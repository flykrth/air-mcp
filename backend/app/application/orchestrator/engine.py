# Thin wrapper for backward compatibility
from app.features.workflow.engine import OrchestratorEngine as FeatureOrchestratorEngine

class OrchestratorEngine(FeatureOrchestratorEngine):
    pass
