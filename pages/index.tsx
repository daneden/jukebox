import Link from "next/link"
import { useEffect, useState } from "react"
import Head from "next/head"

interface Props {
  redirectUri: string
  clientId: string
}

interface Playlist {
  name: string
  uri: string
}

export default function HomePage({ redirectUri, clientId }: Props) {
  const scopes = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-private-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
  ].join(" ")

  const spotifyAuthURL = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scopes=${encodeURIComponent(scopes)}&show_dialog=false`

  const [token, setToken] = useState<string>(null)
  const [viewerName, setViewerName] = useState<string>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [playlist, setPlaylist] = useState<Playlist>(null)

  /**
   * If the page loads with an access_token hash location, extract it for use
   * in API calls
   */
  useEffect(function getTokenFromLocation() {
    const hash = window.location.hash

    if (hash !== undefined && hash.startsWith("#access_token")) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      setToken(params.get("access_token"))
      window.location.hash = ""
    }
  }, [])

  /**
   * If we have an access token, grab the user's name so we can show they're
   * logged in
   */
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

  /**
   * The function responsible for opening Spotify after the user clicks "Choose
   * a random playlist"
   */
  async function pickAndPlayPlaylist() {
    const playlist = await fetch(
      "https://api.spotify.com/v1/me/playlists?limit=50",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((d) => d.json())
      .then((d) => {
        const playlists = d.items
        const candidate =
          playlists[Math.floor(Math.random() * playlists.length)]

        return candidate
      })

    const newWin = window.open(playlist.uri, "_self")

    if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
      setPopupBlocked(true)
    }

    setPlaylist(playlist)
    console.log(playlist)
  }

  return (
    <>
      <Head>
        <title>Jukebox | Random Spotify Playlist Picker</title>
      </Head>
      <main>
        <h1>Jukebox</h1>
        <p>
          Jukebox connects with your Spotify account to randomly select a
          playlist for you to listen to.
        </p>
        {viewerName ? (
          <>
            <p>Logged in as {viewerName}</p>
            <p>
              <button onClick={pickAndPlayPlaylist}>
                Choose a random playlist
              </button>
            </p>
            {playlist?.name && (
              <p>
                <small>Picked playlist “{playlist.name}”</small>
              </p>
            )}
            {popupBlocked && (
              <p>
                <small>
                  Your browser may be blocking popups; you can open the playlist
                  manually at <a href={playlist.uri}>this URL</a>
                </small>
              </p>
            )}
          </>
        ) : (
          <Link href={spotifyAuthURL}>
            <a className="button">Log in with Spotify</a>
          </Link>
        )}
      </main>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
        }

        :root {
          --green: #1db954;
          --black: #191414;
          --white: #fff;

          --background: var(--white);
          --foreground: var(--black);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --background: var(--black);
            --foreground: var(--white);
          }
        }

        html {
          font: 125%/1.5 -apple-system, system-ui, sans-serif;
          background: var(--background);
          color: var(--foreground);
        }

        main {
          padding: 1.5rem;
          margin: auto;
          text-align: center;
          max-width: 24rem;
        }

        p {
          margin-bottom: 1.5rem;
        }

        small {
          opacity: 0.7;
        }

        .button,
        button {
          appearance: none;
          background: var(--green);
          color: var(--white);
          font: inherit;
          font-weight: bold;
          padding: 0.5rem 1rem;
          text-decoration: none;
          border-radius: 1.5rem;
          border: none;
          cursor: pointer;
        }

        :matches(.button, button):hover {
          --green: #2bde6a;
        }
      `}</style>
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
