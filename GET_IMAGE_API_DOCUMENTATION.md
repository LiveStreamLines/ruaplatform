# Get Image API Documentation

## Overview
The Get Image API allows you to retrieve camera images within a specific date and time range. This API requires authentication and provides flexible date range options.

## Endpoint
```
POST /api/get-image/:projectId/:cameraId/
```

## Authentication
🔒 **Authentication Required** - This endpoint requires a valid authentication token.

### Getting Authentication Token

Before using the Get Image API, you need to authenticate and obtain a token using the login endpoint.

#### Login Endpoint
```
POST /api/auth/login
```

#### Login Request Body
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | String | Yes | User email address |
| `password` | String | Yes | User password |

#### Login Example
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

#### Login Response
```json
{
  "_id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "role": "admin",
  "isActive": true,
  "phone": "+1234567890",
  "authh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Using the Token
After successful login, use the `authh` field from the response as your Bearer token:

```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/get-image/proj456/cam789/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "day1": "20231215",
    "time1": "080000"
  }'
```

#### Authentication Errors
- **401 Unauthorized**: Invalid credentials or expired token
- **403 Forbidden**: User account is inactive
- **400 Bad Request**: Missing email or password, invalid email format

#### Token Management
- **Token Field**: The authentication token is returned in the `authh` field of the login response
- **Token Usage**: Include the token in the `Authorization` header as `Bearer {token}`
- **Token Expiry**: Tokens are JWT-based and may expire; re-login if you receive 401 errors
- **Phone Verification**: If `phoneRequired: true` is returned, phone verification may be needed

## URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | String | Yes | The project ID (see available projects below) |
| `cameraId` | String | Yes | The camera ID (see camera naming below) |

**Note:** The developer ID is automatically set to `awj` and does not need to be specified in the URL.

### Available Projects
Currently available project codes:
- **`rabwa`** - Rabwa project
- **`abna`** - Abna project

*Additional projects will be added in the future and their codes will be shared accordingly.*

### Camera Naming Convention
Each project contains multiple cameras with standardized naming:
- **`camera1`** - First camera in the project
- **`camera2`** - Second camera in the project
- **`camera3`** - Third camera in the project (if available)
- And so on...

**Note:** Camera names always follow the pattern `camera{N}` where N is the camera number.

## Request Body

### Required Parameters
| Parameter | Type | Format | Description |
|-----------|------|--------|-------------|
| `day1` | String | YYYYMMDD | Start date (e.g., "20231215") |
| `time1` | String | HHMMSS | Start time (e.g., "080000") |

### Optional Parameters
| Parameter | Type | Format | Description |
|-----------|------|--------|-------------|
| `day2` | String | YYYYMMDD | End date (optional - auto-calculated if not provided) |
| `time2` | String | HHMMSS | End time (optional - auto-calculated if not provided) |

### Auto-Calculation Behavior
When `day2` and `time2` are not provided, the API automatically calculates the end time as **1 hour later** from the start time.

**Examples:**
- Start: `20231215` + `080000` → End: `20231215` + `090000`
- Start: `20231215` + `233000` → End: `20231216` + `003000` (handles date rollover)

## Complete Usage Examples

### Step 1: Login to Get Token
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "_id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "role": "admin",
  "isActive": true,
  "phone": "+1234567890",
  "authh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 2: Use Token for API Calls

#### Example 1: Auto 1-Hour Range (Rabwa Project, Camera 1)
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/get-image/rabwa/camera1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "day1": "20231215",
    "time1": "080000"
  }'
```

#### Example 2: Custom Date Range (Abna Project, Camera 2)
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/get-image/abna/camera2/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "day1": "20231215",
    "time1": "080000",
    "day2": "20231215",
    "time2": "180000"
  }'
```

#### Example 3: Cross-Day Range (Rabwa Project, Camera 1)
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/get-image/rabwa/camera1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "day1": "20231215",
    "time1": "220000",
    "day2": "20231216",
    "time2": "060000"
  }'
```

## Response Format

### Success Response (200 OK)
```json
{
  "images": [
    "20231215080000",
    "20231215080100",
    "20231215080200",
    "20231215080300"
  ],
  "count": 4,
  "dateRange": {
    "start": "20231215 08:00:00",
    "end": "20231215 09:00:00"
  },
  "path": "https://ahcwatch.awjholding.com/backend/media/upload/awj/rabwa/camera1/",
  "autoCalculated": true
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `images` | Array | List of image filenames (without .jpg extension) |
| `count` | Number | Total number of images found |
| `dateRange` | Object | Human-readable start and end times |
| `dateRange.start` | String | Start time in "YYYYMMDD HH:MM:SS" format |
| `dateRange.end` | String | End time in "YYYYMMDD HH:MM:SS" format |
| `path` | String | Base URL for accessing the images |
| `autoCalculated` | Boolean | Indicates if end time was auto-calculated |

## Error Responses

### 400 Bad Request - Missing Parameters
```json
{
  "error": "Missing required parameters: day1, time1"
}
```

### 400 Bad Request - Invalid Date Format
```json
{
  "error": "Invalid date format. Use YYYYMMDD format for day1"
}
```

### 400 Bad Request - Invalid Time Format
```json
{
  "error": "Invalid time format. Use HHMMSS format for time1"
}
```

### 404 Not Found - Camera Directory
```json
{
  "error": "Camera directory not found"
}
```

### 404 Not Found - No Images
```json
{
  "error": "No pictures found in camera directory"
}
```

### 401 Unauthorized - Authentication Required
```json
{
  "error": "Authentication required"
}
```

## Image Access

Images can be accessed using the `path` field from the response:

```
{path}{image_filename}.jpg
```

**Example:**
- Response path: `https://ahcwatch.awjholding.com/backend/media/upload/awj/rabwa/camera1/`
- Image filename: `20231215080000`
- Full URL: `https://ahcwatch.awjholding.com/backend/media/upload/awj/rabwa/camera1/20231215080000.jpg`

## File Naming Convention

Images are stored with filenames in the format:
```
YYYYMMDDHHMMSS.jpg
```

Where:
- `YYYY` = 4-digit year
- `MM` = 2-digit month (01-12)
- `DD` = 2-digit day (01-31)
- `HH` = 2-digit hour (00-23)
- `MM` = 2-digit minute (00-59)
- `SS` = 2-digit second (00-59)

**Example:** `20231215080000.jpg` = December 15, 2023 at 08:00:00

## Use Cases

### 1. Quick Hourly Check
Get all images from the last hour from Rabwa project, Camera 1:
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/get-image/rabwa/camera1/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "day1": "20231215",
    "time1": "140000"
  }'
```

### 2. Business Hours Monitoring
Get images during business hours from Abna project, Camera 2:
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/get-image/abna/camera2/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "day1": "20231215",
    "time1": "080000",
    "day2": "20231215",
    "time2": "170000"
  }'
```

### 3. Night Shift Monitoring
Get images during night shift from Rabwa project, Camera 1:
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/get-image/rabwa/camera1/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "day1": "20231215",
    "time1": "220000",
    "day2": "20231216",
    "time2": "060000"
  }'
```

### 4. Specific Event Investigation
Get images around a specific time from Abna project, Camera 1:
```bash
curl -X POST https://ahcwatch.awjholding.com/backend/api/get-image/abna/camera1/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "day1": "20231215",
    "time1": "143000",
    "day2": "20231215",
    "time2": "150000"
  }'
```

## Rate Limiting
No specific rate limiting is implemented, but consider implementing client-side throttling for high-frequency requests.

## Project and Camera Information

### Current Availability
- **Projects**: `rabwa`, `abna`
- **Cameras per Project**: Each project has 2 cameras (`camera1`, `camera2`)
- **Developer**: All projects are under developer `awj`

### Future Updates
- New projects will be added with their respective codes
- Additional cameras may be added to existing projects
- Project codes and camera names will be communicated when available

### Valid Endpoint Examples
```
POST https://ahcwatch.awjholding.com/backend/api/get-image/rabwa/camera1/
POST https://ahcwatch.awjholding.com/backend/api/get-image/rabwa/camera2/
POST https://ahcwatch.awjholding.com/backend/api/get-image/abna/camera1/
POST https://ahcwatch.awjholding.com/backend/api/get-image/abna/camera2/
```

## Security Notes
- All requests require valid authentication
- Images are served through the authenticated media endpoint
- Ensure proper access control for sensitive camera feeds

## Troubleshooting

### Common Issues

1. **No images returned**
   - Check if the camera directory exists
   - Verify the date/time range contains actual images
   - Ensure proper authentication

2. **Authentication errors**
   - Verify the Authorization header is included with `Bearer` prefix
   - Check if the token is valid and not expired
   - Re-login if you receive 401 Unauthorized errors
   - Ensure the token is from the `authh` field of the login response

3. **Invalid date/time format**
   - Ensure dates are in YYYYMMDD format
   - Ensure times are in HHMMSS format
   - Check for leading zeros (e.g., "08" not "8")

### Debug Tips
- Use the `autoCalculated` field to verify if your end time was auto-calculated
- Check the `dateRange` field for human-readable time ranges
- Verify the `path` field for correct image URL construction

## Version History
- **v1.0** - Initial release with full date range support
- **v1.1** - Added auto-calculation feature for 1-hour ranges
- **v1.2** - Added `autoCalculated` flag and improved error handling
