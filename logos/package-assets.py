"""Package both series using the standard library; leave the original ZIP intact."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

assets = Path(__file__).resolve().parent / 'assets'
with ZipFile(assets / 'ordzson-brandmarks-completa.zip', 'w', ZIP_DEFLATED) as archive:
    for asset in sorted(assets.glob('*.svg')):
        archive.write(asset, f'ordzson-brandmarks/{asset.name}')
    archive.writestr('ordzson-brandmarks/LEEME.txt',
        'Ordzson · Brandmarks Z\n\n'
        '16 símbolos: ocho originales y ocho alternativas más valientes.\n'
        'Los archivos con -bold pertenecen a la nueva serie.\n'
        'Cada símbolo incluye color, negro (-mono) y blanco (-white).\n'
        'SVG con fondo transparente y trazados editables.\n'
        'Dos láminas permiten revisar cada serie por separado.\n')
print('ZIP completo: 48 logos, dos láminas y guía.')
