$basePath = "C:\Users\Adam\.gemini\antigravity-ide\brain\6b55b55c-0f79-4466-8be8-75891ed0b19b\.system_generated\steps"
$steps = @(233,234,235,236,237,241,242,243,244,245,247,248,249,250,251,253,254,255,256,257)

foreach ($s in $steps) {
    $file = Join-Path $basePath "$s\content.md"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Try escaped og:description pattern  
        $pattern = 'og:description.*?content.*?\\\"(.*?per million.*?)\\\"'
        $m = [regex]::Match($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($m.Success) {
            $desc = $m.Groups[1].Value -replace '\\u0026','&'
            Write-Output "STEP ${s}: $desc"
        } else {
            # Try meta description pattern
            $pattern2 = 'description.*?content.*?\\\"(.*?million.*?tokens.*?)\\\"'
            $m2 = [regex]::Match($content, $pattern2, [System.Text.RegularExpressions.RegexOptions]::Singleline)
            if ($m2.Success) {
                $desc2 = $m2.Groups[1].Value -replace '\\u0026','&'
                Write-Output "STEP ${s}: $desc2"
            } else {
                Write-Output "STEP ${s}: NOT FOUND"
            }
        }
        Write-Output "---"
    }
}
