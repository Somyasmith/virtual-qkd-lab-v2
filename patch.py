with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

new_lines = lines[:19] + [
    '  <div style="display:flex;align-items:center;gap:10px;">',
    '',
    '    <!-- ONLY REAL LOGO -->',
    '    <img ',
    '      src="icon.webp" ',
    '      alt="SRM Logo"',
    '      style="',
    '        height:45px;',
    '        width:auto;',
    '        object-fit:contain;',
    '        border-radius:6px;',
    '      "',
    '    />',
    '',
    '  </div>'
] + lines[56:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))
