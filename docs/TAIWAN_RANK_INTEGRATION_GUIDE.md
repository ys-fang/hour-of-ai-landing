# Taiwan Hour of AI Rank - Web Integration Technical Documentation

**Version:** 1.0.0
**Last Updated:** 2026-01-06
**Purpose:** Integrate Taiwan's Hour of AI event ranking into existing web pages

---

## Table of Contents

1. [Overview](#overview)
2. [Data Source](#data-source)
3. [Data Structure](#data-structure)
4. [Integration Options](#integration-options)
5. [Implementation Examples](#implementation-examples)
6. [UI Components](#ui-components)
7. [API Endpoints](#api-endpoints)
8. [Security & Performance](#security--performance)
9. [Deployment Guide](#deployment-guide)

---

## Overview

This system tracks Taiwan's ranking in the CSforAll Hour of AI global event registrations. The data is sourced from a live Google Sheets CSV export and can be integrated into web pages to display:

- Taiwan's current rank
- Number of registered events in Taiwan
- Comparative ranking (countries above/below)
- Global percentile position
- Historical trends (optional)

### Key Features

✅ Real-time data from Google Sheets
✅ Automatic daily updates
✅ RESTful API compatible
✅ Lightweight and cacheable
✅ Multiple display formats supported

---

## Data Source

### Primary Data Source

**URL:** `https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv`

**Data Owner:** CSforAll (https://csforall.org)

**Update Frequency:** Real-time (updated as events are registered)

**Format:** CSV (Comma-Separated Values)

### CSV Structure

```csv
Country,count
United States of America,2398
Afghanistan,0
Albania,10
Algeria,1
...
Taiwan,42
...
```

**Columns:**
- `Country` (string): Full country name
- `count` (integer): Number of registered Hour of AI events

### Data Characteristics

- **Total Countries:** ~200 countries
- **Active Countries:** Countries with count > 0
- **Data Size:** ~8-10 KB
- **Encoding:** UTF-8
- **CORS:** Enabled (can be fetched from browser)

---

## Data Structure

### Processed Data Schema

After fetching and processing, the data should be structured as:

```typescript
interface CountryData {
  country: string;
  count: number;
}

interface TaiwanRankData {
  rank: number;              // Taiwan's global rank (1-indexed)
  count: number;             // Number of events in Taiwan
  totalCountries: number;    // Total countries with events (count > 0)
  percentile: string;        // Top X% (e.g., "25.5")
  context: {
    above: CountryData[];    // Countries ranked above Taiwan
    below: CountryData[];    // Countries ranked below Taiwan
  };
  topCountry: CountryData;   // #1 ranked country
  timestamp: Date;           // When data was fetched
}
```

### Example Response

```json
{
  "rank": 25,
  "count": 42,
  "totalCountries": 87,
  "percentile": "71.3",
  "context": {
    "above": [
      { "country": "Japan", "count": 45 },
      { "country": "South Korea", "count": 43 }
    ],
    "below": [
      { "country": "Singapore", "count": 40 },
      { "country": "Thailand", "count": 38 }
    ]
  },
  "topCountry": {
    "country": "United States of America",
    "count": 2398
  },
  "timestamp": "2026-01-06T08:30:00.000Z"
}
```

---

## Integration Options

### Option 1: Direct Client-Side Fetch (Simplest)

**Pros:**
- No backend required
- Real-time data
- Easy to implement

**Cons:**
- No caching control
- Visible API calls
- Rate limiting concerns

**Use Case:** Small traffic sites, prototypes, internal dashboards

### Option 2: Server-Side API Proxy (Recommended)

**Pros:**
- Caching control
- Rate limiting protection
- Can add authentication
- Better error handling

**Cons:**
- Requires backend
- More complex setup

**Use Case:** Production websites, high-traffic sites

### Option 3: Static Generation + Scheduled Updates

**Pros:**
- Ultra-fast (no runtime fetching)
- No API rate limits
- CDN-friendly

**Cons:**
- Data slightly stale (updated on build)
- Requires build pipeline

**Use Case:** Static sites (Next.js, Gatsby, Hugo, etc.)

### Option 4: Google Apps Script Web App (Hybrid)

**Pros:**
- Free hosting
- Automatic caching
- Easy deployment

**Cons:**
- Google infrastructure dependency
- Limited customization

**Use Case:** Quick deployments, low-budget projects

---

## Implementation Examples

### 1. Client-Side JavaScript (Vanilla)

```javascript
/**
 * Fetch Taiwan rank data directly from Google Sheets
 * @returns {Promise<TaiwanRankData>}
 */
async function fetchTaiwanRank() {
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv';

  try {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();

    // Parse CSV
    const lines = csvText.split('\n');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [country, count] = line.split(',');
      if (country && count) {
        data.push({
          country: country.replace(/^"|"$/g, '').trim(),
          count: parseInt(count.trim())
        });
      }
    }

    // Analyze Taiwan rank
    return analyzeTaiwanRank(data);
  } catch (error) {
    console.error('Error fetching Taiwan rank:', error);
    throw error;
  }
}

/**
 * Analyze Taiwan's ranking from country data
 * @param {Array<{country: string, count: number}>} data
 * @returns {TaiwanRankData}
 */
function analyzeTaiwanRank(data) {
  // Filter and sort
  const sorted = data
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  // Find Taiwan
  const taiwanIndex = sorted.findIndex(item => item.country === 'Taiwan');

  if (taiwanIndex === -1) {
    throw new Error('Taiwan not found in data');
  }

  const taiwan = sorted[taiwanIndex];
  const rank = taiwanIndex + 1;
  const totalCountries = sorted.length;

  return {
    rank: rank,
    count: taiwan.count,
    totalCountries: totalCountries,
    percentile: ((totalCountries - rank + 1) / totalCountries * 100).toFixed(1),
    context: {
      above: sorted.slice(Math.max(0, taiwanIndex - 2), taiwanIndex),
      below: sorted.slice(taiwanIndex + 1, taiwanIndex + 3)
    },
    topCountry: sorted[0],
    timestamp: new Date()
  };
}

// Usage
fetchTaiwanRank()
  .then(data => {
    console.log('Taiwan Rank:', data.rank);
    console.log('Event Count:', data.count);
    displayRankData(data); // Your UI update function
  })
  .catch(error => {
    console.error('Failed to fetch rank:', error);
  });
```

### 2. React Component

```jsx
import React, { useState, useEffect } from 'react';

const TaiwanRankWidget = () => {
  const [rankData, setRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTaiwanRank()
      .then(data => {
        setRankData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="taiwan-rank-widget loading">載入中...</div>;
  if (error) return <div className="taiwan-rank-widget error">錯誤: {error}</div>;
  if (!rankData) return null;

  return (
    <div className="taiwan-rank-widget">
      <div className="rank-header">
        <h3>🇹🇼 台灣 Hour of AI 排名</h3>
      </div>

      <div className="rank-stats">
        <div className="stat-item primary">
          <div className="stat-label">全球排名</div>
          <div className="stat-value">#{rankData.rank}</div>
          <div className="stat-context">共 {rankData.totalCountries} 國</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">活動數量</div>
          <div className="stat-value">{rankData.count}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">百分位</div>
          <div className="stat-value">Top {rankData.percentile}%</div>
        </div>
      </div>

      <div className="rank-context">
        <h4>鄰近排名</h4>
        <ul>
          {rankData.context.above.map((country, idx) => (
            <li key={idx} className="above">
              #{rankData.rank - rankData.context.above.length + idx} {country.country}: {country.count}
            </li>
          ))}
          <li className="current">
            ➡️ #{rankData.rank} 台灣: {rankData.count} ⬅️
          </li>
          {rankData.context.below.map((country, idx) => (
            <li key={idx} className="below">
              #{rankData.rank + idx + 1} {country.country}: {country.count}
            </li>
          ))}
        </ul>
      </div>

      <div className="rank-footer">
        <small>
          資料來源: <a href="https://csforall.org/en-US/hour-of-ai/how-to/global" target="_blank">CSforAll</a>
          <br />
          更新時間: {new Date(rankData.timestamp).toLocaleString('zh-TW')}
        </small>
      </div>
    </div>
  );
};

export default TaiwanRankWidget;
```

### 3. Node.js/Express API Endpoint

```javascript
const express = require('express');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv';

/**
 * API Endpoint: GET /api/taiwan-rank
 */
app.get('/api/taiwan-rank', async (req, res) => {
  try {
    // Check cache first
    const cached = cache.get('taiwan-rank');
    if (cached) {
      return res.json({
        ...cached,
        cached: true
      });
    }

    // Fetch fresh data
    const response = await fetch(CSV_URL);
    const csvText = await response.text();

    // Parse CSV
    const lines = csvText.split('\n');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [country, count] = line.split(',');
      if (country && count) {
        data.push({
          country: country.replace(/^"|"$/g, '').trim(),
          count: parseInt(count.trim())
        });
      }
    }

    // Analyze Taiwan rank
    const rankData = analyzeTaiwanRank(data);

    // Cache the result
    cache.set('taiwan-rank', rankData);

    res.json({
      ...rankData,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching Taiwan rank:', error);
    res.status(500).json({
      error: 'Failed to fetch Taiwan rank data',
      message: error.message
    });
  }
});

function analyzeTaiwanRank(data) {
  const sorted = data
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const taiwanIndex = sorted.findIndex(item => item.country === 'Taiwan');

  if (taiwanIndex === -1) {
    throw new Error('Taiwan not found in data');
  }

  const taiwan = sorted[taiwanIndex];
  const rank = taiwanIndex + 1;
  const totalCountries = sorted.length;

  return {
    rank: rank,
    count: taiwan.count,
    totalCountries: totalCountries,
    percentile: ((totalCountries - rank + 1) / totalCountries * 100).toFixed(1),
    context: {
      above: sorted.slice(Math.max(0, taiwanIndex - 2), taiwanIndex),
      below: sorted.slice(taiwanIndex + 1, taiwanIndex + 3)
    },
    topCountry: sorted[0],
    timestamp: new Date().toISOString()
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Taiwan Rank API running on port ${PORT}`);
});
```

### 4. Next.js Static Generation (SSG)

```javascript
// pages/index.js or components/TaiwanRank.js

import { useState, useEffect } from 'react';

export async function getStaticProps() {
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv';

  const response = await fetch(CSV_URL);
  const csvText = await response.text();

  // Parse and analyze (same logic as above)
  const data = parseCSV(csvText);
  const rankData = analyzeTaiwanRank(data);

  return {
    props: {
      rankData
    },
    revalidate: 3600 // Revalidate every hour (ISR)
  };
}

export default function TaiwanRankPage({ rankData }) {
  return (
    <div>
      <h1>Taiwan Hour of AI Ranking</h1>
      <p>Rank: #{rankData.rank}</p>
      <p>Events: {rankData.count}</p>
    </div>
  );
}
```

### 5. Google Apps Script Web App (Serverless API)

```javascript
/**
 * Deploy as Web App in Google Apps Script
 * Set to "Anyone" or "Anyone with the link"
 */

function doGet(e) {
  try {
    const data = fetchAndParseCSV();
    const taiwanData = analyzeTaiwanRank(data);

    const output = ContentService.createTextOutput(
      JSON.stringify(taiwanData)
    );
    output.setMimeType(ContentService.MimeType.JSON);

    return output;
  } catch (error) {
    const output = ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    );
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

// Include fetchAndParseCSV() and analyzeTaiwanRank() from taiwan-rank-tracker.js
```

**Deployment:**
1. Go to Apps Script → Deploy → New deployment
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Copy the Web App URL

**Usage:**
```javascript
fetch('YOUR_APPS_SCRIPT_WEB_APP_URL')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## UI Components

### CSS Styles (taiwan-rank.css)

```css
.taiwan-rank-widget {
  max-width: 600px;
  margin: 20px auto;
  padding: 24px;
  background: linear-gradient(135deg, #f0f9e8 0%, #ffffff 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
}

.taiwan-rank-widget.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.taiwan-rank-widget.error {
  background: #fee;
  border: 1px solid #fcc;
  color: #c00;
}

.rank-header {
  text-align: center;
  margin-bottom: 24px;
}

.rank-header h3 {
  margin: 0;
  font-size: 24px;
  color: #0a6aad;
}

.rank-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-item.primary {
  background: linear-gradient(135deg, #2989bd, #0a6aad);
  color: white;
}

.stat-label {
  font-size: 12px;
  text-transform: uppercase;
  opacity: 0.8;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-context {
  font-size: 14px;
  opacity: 0.9;
}

.rank-context {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.rank-context h4 {
  margin: 0 0 12px 0;
  color: #0a6aad;
  font-size: 16px;
}

.rank-context ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rank-context li {
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 4px;
  font-size: 14px;
}

.rank-context li.above {
  background: #f5f5f5;
  color: #666;
}

.rank-context li.current {
  background: #ffe59c;
  font-weight: bold;
  color: #0a6aad;
}

.rank-context li.below {
  background: #f5f5f5;
  color: #999;
}

.rank-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.rank-footer small {
  font-size: 12px;
  color: #666;
}

.rank-footer a {
  color: #0a6aad;
  text-decoration: none;
}

.rank-footer a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 600px) {
  .rank-stats {
    flex-direction: column;
  }

  .stat-value {
    font-size: 24px;
  }
}
```

### HTML Widget Template

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Taiwan Hour of AI Rank</title>
  <link rel="stylesheet" href="taiwan-rank.css">
</head>
<body>
  <div id="taiwan-rank-container"></div>

  <script src="taiwan-rank.js"></script>
  <script>
    // Initialize widget
    initTaiwanRankWidget('taiwan-rank-container');
  </script>
</body>
</html>
```

---

## API Endpoints

### Recommended API Design

If you're building a backend API, use these endpoints:

#### 1. Get Taiwan Rank Data

**Endpoint:** `GET /api/taiwan-rank`

**Response:**
```json
{
  "rank": 25,
  "count": 42,
  "totalCountries": 87,
  "percentile": "71.3",
  "context": {
    "above": [...],
    "below": [...]
  },
  "topCountry": {...},
  "timestamp": "2026-01-06T08:30:00.000Z",
  "cached": false
}
```

#### 2. Get Full Country Rankings

**Endpoint:** `GET /api/rankings`

**Query Parameters:**
- `limit` (optional): Number of countries to return
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "rankings": [
    { "rank": 1, "country": "United States of America", "count": 2398 },
    { "rank": 2, "country": "India", "count": 156 },
    ...
  ],
  "total": 87,
  "timestamp": "2026-01-06T08:30:00.000Z"
}
```

#### 3. Get Historical Data (if tracking)

**Endpoint:** `GET /api/taiwan-rank/history`

**Query Parameters:**
- `days` (optional): Number of days to retrieve (default: 30)

**Response:**
```json
{
  "history": [
    { "date": "2026-01-06", "rank": 25, "count": 42 },
    { "date": "2026-01-05", "rank": 26, "count": 41 },
    ...
  ]
}
```

---

## Security & Performance

### Security Considerations

1. **Rate Limiting**
   ```javascript
   // Express example
   const rateLimit = require('express-rate-limit');

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });

   app.use('/api/', limiter);
   ```

2. **CORS Configuration**
   ```javascript
   const cors = require('cors');

   app.use(cors({
     origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
     methods: ['GET'],
     credentials: false
   }));
   ```

3. **Input Validation**
   - Validate query parameters
   - Sanitize CSV data
   - Handle malformed responses

### Performance Optimization

1. **Caching Strategy**
   - Cache duration: 1 hour (data doesn't change frequently)
   - Use Redis, Memcached, or in-memory cache
   - Set appropriate Cache-Control headers

2. **CDN Integration**
   ```javascript
   res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
   ```

3. **Compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

4. **Lazy Loading**
   - Load widget only when visible (Intersection Observer)
   - Defer non-critical data fetching

---

## Deployment Guide

### Deployment Checklist

- [ ] Choose integration method (client-side, server-side, static)
- [ ] Set up caching mechanism
- [ ] Configure CORS if needed
- [ ] Add error handling and fallbacks
- [ ] Test with production data
- [ ] Monitor API usage and performance
- [ ] Set up alerts for failures
- [ ] Document for team

### Environment Variables

```bash
# .env file
CSV_DATA_URL=https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv
CACHE_DURATION=3600
PORT=3000
NODE_ENV=production
```

### Deployment Platforms

#### Vercel (Recommended for Next.js)
```bash
npm install -g vercel
vercel
```

#### Netlify (Recommended for Static Sites)
```bash
npm run build
netlify deploy --prod
```

#### Heroku (Recommended for Node.js API)
```bash
git push heroku main
```

#### Google Cloud Run (Containerized)
```bash
gcloud run deploy taiwan-rank-api --source .
```

---

## Testing & Monitoring

### Unit Tests Example (Jest)

```javascript
const { analyzeTaiwanRank } = require('./taiwan-rank');

describe('Taiwan Rank Analysis', () => {
  const mockData = [
    { country: 'United States', count: 2398 },
    { country: 'India', count: 156 },
    { country: 'Taiwan', count: 42 },
    { country: 'Japan', count: 35 },
  ];

  test('should calculate correct rank for Taiwan', () => {
    const result = analyzeTaiwanRank(mockData);
    expect(result.rank).toBe(3);
  });

  test('should return correct event count', () => {
    const result = analyzeTaiwanRank(mockData);
    expect(result.count).toBe(42);
  });

  test('should include context countries', () => {
    const result = analyzeTaiwanRank(mockData);
    expect(result.context.above.length).toBeGreaterThan(0);
    expect(result.context.below.length).toBeGreaterThan(0);
  });
});
```

### Monitoring

Set up monitoring for:
- API response times
- Error rates
- Cache hit ratios
- Data freshness
- Uptime

**Tools:** New Relic, Datadog, Google Analytics, Sentry

---

## Troubleshooting

### Common Issues

**Issue:** Taiwan not found in data
**Solution:** Check if data source has changed, verify country name spelling

**Issue:** CORS errors
**Solution:** Add proper CORS headers or use server-side proxy

**Issue:** Stale data
**Solution:** Check cache TTL, force refresh mechanism

**Issue:** Rate limiting from Google Sheets
**Solution:** Implement caching, reduce fetch frequency

---

## License & Attribution

**Data Source:** CSforAll (https://csforall.org)
**License:** Use for educational and non-commercial purposes
**Attribution Required:** Yes - link to CSforAll website

---

## Support & Updates

For questions or issues:
- Check this documentation
- Review source code in `taiwan-rank-tracker.js`
- Contact: [Your contact information]

**Last Updated:** 2026-01-06
**Version:** 1.0.0
