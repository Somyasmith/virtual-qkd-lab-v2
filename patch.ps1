$path = "c:\Users\asus\OneDrive\Desktop\VIRTUAL_LAB\index.html"
$content = [IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# 1. Update Active Tabs
$content = $content.Replace('<div class="tab" data-panel="p-home">🏠 Home</div>', '<div class="tab active" data-panel="p-home">Home</div>')
$content = $content.Replace('<div class="tab active" data-panel="p-exp">⚗️ Modules</div>', '<div class="tab" data-panel="p-exp">Modules</div>')
$content = $content.Replace('<div class="tab" data-panel="p-about">ℹ️ About</div>', '<div class="tab" data-panel="p-about">About</div>')
$content = $content.Replace('<div class="tab" data-panel="p-feedback">💬 Feedback</div>', '<div class="tab" data-panel="p-feedback">Feedback</div>')

$content = $content.Replace('<div class="tab" data-panel="p-home">Home</div>', '<div class="tab active" data-panel="p-home">Home</div>')
$content = $content.Replace('<div class="tab active" data-panel="p-exp">Modules</div>', '<div class="tab" data-panel="p-exp">Modules</div>')

$content = $content.Replace('<div class="panel" id="p-home">', '<div class="panel active" id="p-home">')
$content = $content.Replace('<div class="panel active" id="p-exp">', '<div class="panel" id="p-exp">')

# 2. Insert Team Details after the quick stats bar.
$targetBlock = @"
  <!-- Quick stats bar -->
"@

$teamDetailsHTML = @"
  <!-- Team Details -->
  <div style="max-width:760px;margin:36px auto;padding:0 32px;text-align:center;">
    <h2 style="color:#63b3ed;font-size:24px;margin-bottom:10px;">Problem no: 21</h2>
    <h3 style="color:#e8eef8;font-size:20px;margin-bottom:20px;">Problem Name : Quantum Protocol & Algorithm Simulator</h3>
    
    <h3 style="color:#e74c3c;font-size:22px;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Team Details</h3>
    
    <div style="background:linear-gradient(135deg,#1a2a4a,#1a3060);border:1px solid rgba(99,179,237,0.25);border-radius:14px;padding:26px 28px;text-align:left;display:inline-block;width:100%;">
        <table style="width:100%;color:rgba(220,235,255,0.85);font-size:16px;line-height:1.8;">
            <tr>
                <td style="font-weight:700;color:#63b3ed;width:40%;">Team Name</td>
                <td>: EntangleX</td>
            </tr>
            <tr>
                <td style="font-weight:700;color:#63b3ed;">Department Name</td>
                <td>: Electronics and Communication Engineering</td>
            </tr>
            <tr>
                <td style="font-weight:700;color:#63b3ed;">Campus Name</td>
                <td>: SRMIST Kattankulathur</td>
            </tr>
            <tr>
                <td style="font-weight:700;color:#63b3ed;">Team Size</td>
                <td>: 04</td>
            </tr>
        </table>
    </div>
  </div>

  <!-- Quick stats bar -->
"@

$content = $content.Replace($targetBlock, $teamDetailsHTML)

# 3. Strip emojis
$emojis = @("🏠", "⚗️", "ℹ️", "💬", "🚀", "📌", "✔", "⚛️", "🔐", "🧠", "📘", "💡", "🔑", "🔬", "🧪", "🌫", "🌀", "🔄", "📊", "🌐", "🌍", "🪙", "📩", "📦", "🔓", "⏳", "👉", "⚠️", "✅", "🎓", "⚡")

foreach ($e in $emojis) {
    if ($e) {
        $content = $content.Replace("$e ", "")
        $content = $content.Replace("$e", "")
    }
}

[IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
