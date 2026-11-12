param(
    [Parameter(Mandatory = $true)][string]$TextFile,
    [Parameter(Mandatory = $true)][string]$OutputFile
)

Add-Type -AssemblyName System.Speech
$speech = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $voice = $speech.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -eq 'Microsoft Zira Desktop' } | Select-Object -First 1
    if ($voice) { $speech.SelectVoice($voice.VoiceInfo.Name) }
    $speech.Rate = 1
    $speech.SetOutputToWaveFile($OutputFile)
    $speech.Speak((Get-Content -LiteralPath $TextFile -Raw -Encoding UTF8))
} finally {
    $speech.Dispose()
}