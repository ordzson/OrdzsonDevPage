"""Package imagegen proposals without changing the existing SVG collections."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

assets = Path(__file__).resolve().parent / 'assets'
images = assets / 'imagegen'
prompts = json.loads((images / 'prompts.json').read_text())
with ZipFile(assets / 'ordzson-brandmarks-imagegen.zip', 'w', ZIP_DEFLATED) as archive:
    for proposal in prompts:
        image = images / f"{proposal['id']}.png"
        archive.write(image, f'ordzson-imagegen/{image.name}')
    archive.write(images / 'prompts.json', 'ordzson-imagegen/prompts.json')
    archive.writestr('ordzson-imagegen/LEEME.txt',
        'Ordzson · Ocho exploraciones Z con imagegen\n\n'
        'Marea, Vitral, Pulso, Fotón, Perihelio, Troquel, Ensamble y Trazo.\n'
        'PNG originales con transparencia nativa, 1254 × 1254 px.\n'
        'Generados con la herramienta integrada image_gen, sin CLI/API propia.\n'
        'Los prompts exactos están en prompts.json y dentro de cada PNG.\n'
        'Son exploraciones de identidad, todavía sin selección final.\n'
        'Las muestras de silueta de la galería son filtros de visualización;\n'
        'los PNG de esta colección conservan el color original.\n')
print('ZIP imagegen: ocho PNG transparentes, prompts y guía.')
