from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAgent(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        """
        Executes agent reasoning.
        Receives:
            state: The current state of the mission.
            mcp_client: An active MCP connection/helper to call tools or read resources.
        Returns:
            A dictionary containing the updates to merge into the mission state.
        """
        pass

    def log(self, logs_list: List[str], message: str):
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        logs_list.append(f"[{timestamp}] [{self.name}] {message}")
        print(f"[{self.name}] {message}")
