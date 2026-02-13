export default async function SharePage({ params }) {
  const { id } = await params
  return <div>id is: {id}</div>
}