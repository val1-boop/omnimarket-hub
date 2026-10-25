import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/server/auth-guard";

// Foto de un producto. Solo la ve quien tiene sesión y solo si el producto es de su tienda
// o de la tienda de demostración; si no, responde 404 (igual que si no existiera).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user?.id) return new Response("No encontrada", { status: 404 });

  const { id } = await params;
  const image = await prisma.productImage.findFirst({
    where: { productId: id, product: { store: { OR: [{ ownerId: user.id }, { isDemo: true }] } } },
    select: { data: true, mimeType: true },
  });
  if (!image) return new Response("No encontrada", { status: 404 });

  return new Response(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      // La dirección cambia cuando cambia la foto (?v=...), así que el navegador la puede guardar mucho tiempo.
      // "private": solo en el navegador de la persona, nunca en cachés compartidos.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
