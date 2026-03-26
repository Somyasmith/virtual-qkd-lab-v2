import codecs

emojis = ['🏠', '⚗️', 'ℹ️', '💬', '🚀', '📌', '⚛️', '🔐', '🧠', '📘', '💡', '🔑', '🔬', '🧪', '🌫', '🌀', '🔄', '📊', '🌐', '🌍', '🪙', '📩', '📦', '🔓', '⏳', '👉', '⚠️', '✅', '🎓', '⚡', '🔄', '🧠', '⚛️', '🔐', '🔑', '🔬', '🧪', '🌫', '🌀', '📊', '🌐', '🌍', '🪙', '📩', '📦', '🔓', '⏳', '👉', '⚠️', '✅', '🎓']

with codecs.open('index.html', 'r', 'utf-8') as f:
    content = f.read()

# Swap tabs and panels
content = content.replace('<div class="tab" data-panel="p-home">🏠 Home</div>', '<div class="tab active" data-panel="p-home">Home</div>')
content = content.replace('<div class="tab active" data-panel="p-exp">⚗️ Modules</div>', '<div class="tab" data-panel="p-exp">Modules</div>')
content = content.replace('<div class="tab" data-panel="p-about">ℹ️ About</div>', '<div class="tab" data-panel="p-about">About</div>')
content = content.replace('<div class="tab" data-panel="p-feedback">💬 Feedback</div>', '<div class="tab" data-panel="p-feedback">Feedback</div>')

# In case emojis were already partially removed or just to be safe
content = content.replace('<div class="tab" data-panel="p-home">Home</div>', '<div class="tab active" data-panel="p-home">Home</div>')
content = content.replace('<div class="tab active" data-panel="p-exp">Modules</div>', '<div class="tab" data-panel="p-exp">Modules</div>')

content = content.replace('<div class="panel" id="p-home">', '<div class="panel active" id="p-home">')
content = content.replace('<div class="panel active" id="p-exp">', '<div class="panel" id="p-exp">')

# Remove emojis
for e in emojis:
    content = content.replace(e + ' ', '')
    content = content.replace(e, '')
    
with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(content)
