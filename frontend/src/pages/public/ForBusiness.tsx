import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export function ForBusiness() {
  return (
    <>
      <section className="page wrap business-hero">
        <div>
          <p className="eyebrow">YOUR SPACE HAS A SOCIAL SIDE</p>
          <h1>
            More than customers.
            <br />
            <em>A community.</em>
          </h1>
          <p className="lead">
            Turn a quiet corner, an open table or a free afternoon into a reason for people to come
            together.
          </p>
          <Link className="button blue-button" to="/business/apply">
            Join as a local place <ArrowUpRight size={18} />
          </Link>
          <p className="fine-print">For cafés, bookshops, studios and spaces with a little soul.</p>
        </div>
        <img src="/images/coffee.jpg" alt="Coffee served at a welcoming local café" />
      </section>
      <section className="how-section">
        <div className="wrap">
          <p className="eyebrow">A LITTLE SUPPORT. A LOT OF POSSIBILITY.</p>
          <h2>You make the space. We help make the connection.</h2>
          <div className="steps">
            <div>
              <span className="step-number blue-text">01</span>
              <h3>Tell us about your place.</h3>
              <p>
                Create an account and send your venue details. Our team reviews every space before
                it joins the collective.
              </p>
            </div>
            <div>
              <span className="step-number red-text">02</span>
              <h3>Make a little plan.</h3>
              <p>
                Create a gathering, set your capacity and submit it for review. Keep it small,
                welcoming and easy to join.
              </p>
            </div>
            <div>
              <span className="step-number yellow-text">03</span>
              <h3>Welcome your people.</h3>
              <p>
                Manage your gatherings and RSVP lists in your business portal. Check in guests when
                they arrive.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="page wrap">
        <h2>Let’s make your neighbourhood a little closer.</h2>
        <Link className="button" to="/business/apply">
          Register your place <ArrowRight size={18} />
        </Link>
      </div>
    </>
  );
}
