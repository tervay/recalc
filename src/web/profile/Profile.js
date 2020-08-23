import { getCalculators } from "common/services/db";
import React, { useEffect, useState } from "react";
import { useSelector } from "redux-zero/react";
import ago from "s-ago";

export default function Profile() {
  const isSignedIn = useSelector(({ isSignedIn }) => isSignedIn);
  const user = useSelector(({ id }) => id);
  const [calcs, setCalcs] = useState([]);

  useEffect(() => {
    if (user !== null) {
      getCalculators(user, setCalcs);
    }
  }, [isSignedIn, user]);

  if (!isSignedIn) {
    return <div>Log in to see your profile :)</div>;
  }

  return (
    <>
      {calcs.map((c) => {
        const createdDate = new Date(c.created);
        // const modifiedDate = new Date(c.modified);

        return (
          <nav className="level" key={c.created}>
            <div className="level-item">
              <div>
                <p>
                  <a href={`${c.url}?${c.query}`}>{c.name}</a>
                </p>
              </div>
            </div>
            <div className="level-item">
              <div>
                <p>{ago(createdDate)}</p>
              </div>
            </div>
          </nav>
        );
      })}
    </>
  );
}
