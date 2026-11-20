import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export function About() {
  return (
    <article className="page narrow prose">
      <p className="eyebrow">HOME. WORK. AND SOMETHING MORE.</p>
      <h1>We all need a third place.</h1>
      <p className="lead">
        A familiar face. A favourite corner. Somewhere you can turn up and feel like you belong.
      </p>
      <img
        className="story-image"
        src="/images/community.jpg"
        alt="People coming together over food"
      />
      <h2>Connection shouldn’t be so complicated.</h2>
      <p>
        Somewhere after school and university, meeting people stops happening quite so naturally.
        Group chats get busy. Plans stay plans. And our cities are full of wonderful places we walk
        past every day.
      </p>
      <p>
        The Third Place Collective brings those things together: curious people, local spaces and
        small gatherings that make it easier to say hello.
      </p>
      <h2>Local places. Shared possibilities.</h2>
      <p>
        We’re starting with the cafés, bookshops, studios and community spaces that already make
        South African neighbourhoods special. A coffee walk here. A book conversation there. Little
        reasons to get out and make a connection.
      </p>
      <Link className="button" to="/discover">
        Find your third place <ArrowUpRight size={18} />
      </Link>
    </article>
  );
}
