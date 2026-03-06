from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Attr, Key

from app.config import settings


class DynamoService:
    """Service for DynamoDB CRUD operations."""

    def __init__(self) -> None:
        self._resource = boto3.resource("dynamodb", region_name=settings.AWS_REGION)

    def _table(self, table_name: str):
        return self._resource.Table(table_name)

    async def put_item(self, table_name: str, item: Dict[str, Any]) -> None:
        """Put an item into the specified table."""
        self._table(table_name).put_item(Item=item)

    async def get_item(
        self, table_name: str, key: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Get a single item by primary key."""
        response = self._table(table_name).get_item(Key=key)
        return response.get("Item")

    async def query_by_user(
        self,
        table_name: str,
        user_id: str,
        index_name: str = "user-index",
    ) -> List[Dict[str, Any]]:
        """Query items by user_id using a GSI."""
        response = self._table(table_name).query(
            IndexName=index_name,
            KeyConditionExpression=Key("user_id").eq(user_id),
            ScanIndexForward=False,
        )
        return response.get("Items", [])

    async def update_item(
        self,
        table_name: str,
        key: Dict[str, Any],
        updates: Dict[str, Any],
    ) -> None:
        """Update specific attributes on an item."""
        update_expr_parts = []
        expr_names = {}
        expr_values = {}

        for i, (attr, value) in enumerate(updates.items()):
            placeholder = f"#attr{i}"
            val_placeholder = f":val{i}"
            update_expr_parts.append(f"{placeholder} = {val_placeholder}")
            expr_names[placeholder] = attr
            expr_values[val_placeholder] = value

        self._table(table_name).update_item(
            Key=key,
            UpdateExpression="SET " + ", ".join(update_expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )

    async def delete_item(self, table_name: str, key: Dict[str, Any]) -> None:
        """Delete an item by primary key."""
        self._table(table_name).delete_item(Key=key)

    async def scan_with_filter(
        self,
        table_name: str,
        filter_expression: Any,
    ) -> List[Dict[str, Any]]:
        """Scan a table with a filter expression."""
        response = self._table(table_name).scan(
            FilterExpression=filter_expression,
        )
        items = response.get("Items", [])

        # Handle pagination
        while "LastEvaluatedKey" in response:
            response = self._table(table_name).scan(
                FilterExpression=filter_expression,
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))

        return items


dynamo_service = DynamoService()
