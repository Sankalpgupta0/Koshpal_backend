# Coach Consultation Management API

## Overview
New API endpoints for coaches to view and manage their consultations with different filters.

## Endpoints

### 1. Get All Consultations
**GET** `/api/v1/coach/consultations`

Retrieve all booked consultations for the authenticated coach.

**Authentication:** Bearer Token (Coach role required)

**Response:**
```json
[
  {
    "id": "slot-uuid",
    "date": "2025-12-18T00:00:00.000Z",
    "startTime": "2025-12-18T09:00:00.000Z",
    "endTime": "2025-12-18T10:00:00.000Z",
    "status": "BOOKED",
    "booking": {
      "id": "booking-uuid",
      "status": "CONFIRMED",
      "meetingLink": "https://meet.google.com/abc-defg-hij",
      "bookedAt": "2025-12-17T10:30:00.000Z",
      "employee": {
        "id": "employee-uuid",
        "email": "employee@example.com",
        "fullName": "John Doe",
        "phone": "+91 98765 43210"
      }
    }
  }
]
```

---

### 2. Get Past Consultations
**GET** `/api/v1/coach/consultations?filter=past`

Retrieve all past consultations (end time is before current time).

**Query Parameters:**
- `filter=past` (required)

**Authentication:** Bearer Token (Coach role required)

**Response:** Same as "Get All Consultations" but filtered for past sessions
**Sorting:** Most recent first (descending by date and time)

---

### 3. Get Upcoming Consultations
**GET** `/api/v1/coach/consultations?filter=upcoming`

Retrieve all upcoming consultations (start time is in the future).

**Query Parameters:**
- `filter=upcoming` (required)

**Authentication:** Bearer Token (Coach role required)

**Response:** Same as "Get All Consultations" but filtered for future sessions
**Sorting:** Nearest first (ascending by date and time)

---

### 4. Get This Month's Consultations
**GET** `/api/v1/coach/consultations?filter=thisMonth`

Retrieve all consultations scheduled for the current month.

**Query Parameters:**
- `filter=thisMonth` (required)

**Authentication:** Bearer Token (Coach role required)

**Response:** Same as "Get All Consultations" but filtered for current month
**Sorting:** Chronological order (ascending by date and time)

---

### 5. Get Consultation Statistics
**GET** `/api/v1/coach/consultations/stats`

Get summary statistics of consultations for the authenticated coach.

**Authentication:** Bearer Token (Coach role required)

**Response:**
```json
{
  "total": 45,
  "past": 30,
  "upcoming": 10,
  "thisMonth": 15
}
```

**Fields:**
- `total`: Total number of all consultations
- `past`: Number of completed consultations
- `upcoming`: Number of future consultations
- `thisMonth`: Number of consultations in current month

---

## Filter Options

| Filter | Description | Sorting |
|--------|-------------|---------|
| (none/all) | All booked consultations | Oldest first |
| `past` | Consultations that have ended | Most recent first |
| `upcoming` | Consultations scheduled in future | Nearest first |
| `thisMonth` | Consultations in current calendar month | Chronological |

---

## Response Fields

### Consultation Object
- `id`: Unique slot identifier
- `date`: Consultation date (midnight UTC)
- `startTime`: Consultation start time (ISO 8601)
- `endTime`: Consultation end time (ISO 8601)
- `status`: Slot status (always "BOOKED" in these responses)
- `booking`: Booking details object (null if not booked)

### Booking Object
- `id`: Unique booking identifier
- `status`: Booking status ("CONFIRMED" or "CANCELLED")
- `meetingLink`: Video meeting link
- `bookedAt`: Timestamp when booking was created
- `employee`: Employee details object

### Employee Object
- `id`: Employee user ID
- `email`: Employee email
- `fullName`: Employee full name
- `phone`: Employee phone number (optional)

---

## Usage Examples

### Get Upcoming Sessions (Next 7 days)
```bash
curl -X GET "http://localhost:3000/api/v1/coach/consultations?filter=upcoming" \
  -H "Authorization: Bearer YOUR_COACH_TOKEN"
```

### Get This Month's Statistics
```bash
curl -X GET "http://localhost:3000/api/v1/coach/consultations/stats" \
  -H "Authorization: Bearer YOUR_COACH_TOKEN"
```

### Get Past Consultations for Review
```bash
curl -X GET "http://localhost:3000/api/v1/coach/consultations?filter=past" \
  -H "Authorization: Bearer YOUR_COACH_TOKEN"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden (Wrong Role)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

---

## Postman Collection

All endpoints have been added to the **Coach Portal** folder in the Postman collection:
- Get Consultations - All
- Get Consultations - Past
- Get Consultations - Upcoming
- Get Consultations - This Month
- Get Consultation Stats

**Total Coach Portal Endpoints:** 8

---

## Implementation Notes

1. **Timezone Handling:** All times are stored and returned in UTC
2. **Date Filtering:** 
   - "This Month" uses calendar month boundaries
   - "Past" uses current timestamp for comparison
   - "Upcoming" includes today's future sessions
3. **Employee Privacy:** Only basic employee details are returned
4. **Performance:** Employee details are batch-fetched to optimize queries
5. **Status:** Only slots with status "BOOKED" are included

---

## Database Schema

**CoachSlot Table:**
- Links to `ConsultationBooking` (1:1 relationship)
- Indexed on `(coachId, date)` for efficient querying

**ConsultationBooking Table:**
- Unique constraint on `slotId`
- Contains meeting link and booking status

---

## Next Steps

To use these endpoints in the coach frontend:
1. Login as coach to get authentication token
2. Call `/consultations/stats` for dashboard overview
3. Use filter parameter to show different views
4. Display upcoming sessions prominently
5. Allow review of past consultations

