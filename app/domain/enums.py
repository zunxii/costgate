from enum import Enum


class ScanType(str, Enum):
    SEQ_SCAN = "Seq Scan"
    INDEX_SCAN = "Index Scan"
    BITMAP_INDEX_SCAN = "Bitmap Index Scan"
    BITMAP_HEAP_SCAN = "Bitmap Heap Scan"
    UNKNOWN = "Unknown"


class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class CostDirection(str, Enum):
    INCREASE = "increase"
    DECREASE = "decrease"
    NEUTRAL = "neutral"