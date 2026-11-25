import os
from PIL import Image, ImageDraw, ImageFont

def create_forma_icon(size=512):
    # Crear imagen RGBA
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Fondo squircle redondeado moderno con degradado sutil
    margin = size * 0.04
    radius = size * 0.22
    
    # Fondo base oscuro obsidian profundo
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(11, 15, 25, 255)
    )
    
    # Borde sutil fino plateado / esmeralda
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        outline=(26, 42, 60, 255),
        width=int(size * 0.015)
    )

    # 2. Glifo geométrico afilado "F" estilizado para FORMA
    # Formado por:
    # - Columna vertical sólida (Emerald -> Cyan)
    # - Barra horizontal superior potente
    # - Barra horizontal media dinámica
    
    s = size / 512.0
    
    # Coordenadas maestras (base 512)
    # Columna izquierda
    draw.rounded_rectangle(
        [135 * s, 110 * s, 195 * s, 400 * s],
        radius=14 * s,
        fill=(16, 185, 129, 255) # Emerald
    )
    
    # Barra superior
    draw.rounded_rectangle(
        [195 * s, 110 * s, 385 * s, 175 * s],
        radius=14 * s,
        fill=(16, 185, 129, 255)
    )
    # Acento superior en la punta (Cyan brillante)
    draw.rounded_rectangle(
        [325 * s, 110 * s, 385 * s, 175 * s],
        radius=14 * s,
        fill=(52, 211, 153, 255)
    )

    # Barra media (más corta, deportiva)
    draw.rounded_rectangle(
        [195 * s, 220 * s, 335 * s, 280 * s],
        radius=12 * s,
        fill=(56, 189, 248, 255) # Electric Sky / Cobalt
    )

    # Pequeño punto / prisma de acento atlético (Dualis hint)
    draw.ellipse(
        [355 * s, 340 * s, 385 * s, 370 * s],
        fill=(168, 85, 247, 255) # Purple Dualis accent
    )

    return img

def main():
    base_dir = r"C:\Users\Ismael\.gemini\antigravity\scratch\gym-app"
    public_dir = os.path.join(base_dir, "public")
    android_res = os.path.join(base_dir, "android", "app", "src", "main", "res", "mipmap-xxxhdpi")
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(android_res, exist_ok=True)
    
    # 512x512
    img512 = create_forma_icon(512)
    img512.save(os.path.join(public_dir, "icon-512.png"))
    img512.save(os.path.join(android_res, "ic_launcher.png"))
    img512.save(os.path.join(android_res, "ic_launcher_round.png"))
    
    # 192x192
    img192 = img512.resize((192, 192), Image.Resampling.LANCZOS)
    img192.save(os.path.join(public_dir, "icon-192.png"))
    
    # Favicon 64x64
    img64 = img512.resize((64, 64), Image.Resampling.LANCZOS)
    img64.save(os.path.join(public_dir, "favicon.png"))
    
    print("Logos y assets de FORMA generados correctamente.")

if __name__ == "__main__":
    main()
