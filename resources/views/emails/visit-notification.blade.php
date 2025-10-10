<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Website Visit</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background: #f8f9fa;
            padding: 20px;
            border: 1px solid #e9ecef;
        }
        .footer {
            background: #343a40;
            color: white;
            padding: 15px;
            border-radius: 0 0 8px 8px;
            text-align: center;
            font-size: 12px;
        }
        .info-row {
            margin: 10px 0;
            padding: 8px;
            background: white;
            border-left: 4px solid #667eea;
            border-radius: 4px;
        }
        .label {
            font-weight: bold;
            color: #495057;
        }
        .value {
            color: #6c757d;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 New Website Visit</h1>
        <p>Someone just visited your GraveYard Jokes subdomain!</p>
    </div>
    
    <div class="content">
        <div class="info-row">
            <div class="label">🌐 Subdomain:</div>
            <div class="value">{{ $visitData['subdomain'] ?? 'N/A' }}</div>
        </div>
        
        <div class="info-row">
            <div class="label">📄 Page URL:</div>
            <div class="value">{{ $visitData['referrer'] ?? 'N/A' }}</div>
        </div>
        
        <div class="info-row">
            <div class="label">📝 Page Title:</div>
            <div class="value">{{ $visitData['page_title'] ?? 'N/A' }}</div>
        </div>
        
        <div class="info-row">
            <div class="label">🌍 IP Address:</div>
            <div class="value">{{ $visitData['ip'] ?? 'N/A' }}</div>
        </div>
        
        <div class="info-row">
            <div class="label">🕐 Timestamp:</div>
            <div class="value">{{ $visitData['timestamp'] ?? 'N/A' }}</div>
        </div>
        
        <div class="info-row">
            <div class="label">💻 User Agent:</div>
            <div class="value">{{ $visitData['user_agent'] ?? 'N/A' }}</div>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated notification from your GraveYard Jokes studio subdomain tracking system.</p>
    </div>
</body>
</html>