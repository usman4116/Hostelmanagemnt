export default function ResidentRoomPage() {
  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Resident Room</h1>
      <div className="rounded-xl border p-6 grid grid-cols-2 gap-6">
        <div><strong>Room:</strong> 101</div>
        <div><strong>Bed:</strong> B1</div>
        <div><strong>Floor:</strong> 2nd</div>
        <div><strong>Building:</strong> A Block</div>
        <div><strong>Room Type:</strong> Shared</div>
        <div><strong>Status:</strong> Occupied</div>
      </div>
    </main>
  );
}