export default function Missing({ name = "Page" }: { name?: string }) {

  return (

    <main className="mx-auto max-w-6xl px-4 py-16">

      <h1 className="text-2xl font-semibold">{name} temporarily unavailable</h1>

      <p className="mt-2 text-steel/80">Add the file and this route will auto-load without code changes.</p>

    </main>

  )

}










