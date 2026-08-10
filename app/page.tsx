import { IndizioHome } from './_components/indizio-home'
import { sites } from './_data/sites'

export default function HomePage() {
  return <IndizioHome initialSites={sites} />
}
