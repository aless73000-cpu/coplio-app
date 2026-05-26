import { redirect } from 'next/navigation'

export default function MesVotesRedirect() {
  redirect('/mes-travaux?tab=votes')
}
