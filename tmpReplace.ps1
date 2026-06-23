 = 'client\src\components\nexus-engine\rendering\HiveCanvas.tsx'
 = Get-Content -Path  -Raw
 = "style={{ height: '600px', background: '#020202' }}"
 = "style={{ width: '100vw', height: '100vh', background: '#020202' }}"
 =  -replace [regex]::Escape(), 
Set-Content -Path  -Value  -Encoding UTF8
