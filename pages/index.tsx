import Link from "next/link"
import { useEffect, useState } from "react"

interface Props {
  redirectUri: string
  clientId: string
}

export default function HomePage({ redirectUri, clientId }: Props) {
  const scopes =
    "user-private-read playlist-read-private playlist-read-collaborative user-library-read"
  const spotifyAuthURL = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scopes=${encodeURIComponent(scopes)}`
  const [token, setToken] = useState<string>(null)
  const [viewerName, setViewerName] = useState<string>(null)

  useEffect(function getTokenFromLocation() {
    const hash = window.location.hash

    if (hash !== undefined && hash.startsWith("#access_token")) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      setToken(params.get("access_token"))
    }
  }, [])

  useEffect(
    function fetchAndSetViewerName() {
      if (token) {
        fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((d) => d.json())
          .then((d) => {
            setViewerName(d.display_name)
          })
      }
    },
    [token]
  )

  async function pickAndPlayPlaylist() {
    await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((d) => d.json())
      .then((d) => {
        const playlists = d.items
        const candidate =
          playlists[Math.floor(Math.random() * playlists.length)]

        window.open(candidate.external_urls.spotify)
      })
  }

  return (
    <>
      <h1>Jukebox</h1>
      {viewerName ? (
        <>
          <p>Logged in as {viewerName}</p>
          <button onClick={pickAndPlayPlaylist}>Play a random playlist</button>
        </>
      ) : (
        <Link href={spotifyAuthURL}>
          <a>Log in with Spotify</a>
        </Link>
      )}
    </>
  )
}

export function getStaticProps() {
  return {
    props: {
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.SPOTIFY_CLIENT_ID,
    },
  }
}
