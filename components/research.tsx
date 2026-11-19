import React from "react";
import { backgrounds, papers } from "../lib/demo-fixtures";
export function Research({ id }: { id: string }) {
  const b = backgrounds.find((p) => p.id === id);
  if (!b) return null;
  const authored = papers.filter((p) => p.authors.includes(b.authorKey));
  return (
    <section className="research">
      <h3>Research and publications</h3>
      <p>{b.bio}</p>
      <div className="sourceLinks">
        <a href={b.source} target="_blank" rel="noreferrer">
          Research profile
        </a>
        {b.id === "yun" && (
          <a
            href="https://ischool.illinois.edu/news-events/news/2026/04/new-app-designed-improve-conference-experience"
            target="_blank"
            rel="noreferrer"
          >
            PapersClaw project
          </a>
        )}
      </div>
      {authored.length > 0 && (
        <>
          <h4>Authored CHI ’26 contributions</h4>
          <ul>
            {authored.map((p) => (
              <li key={p.id}>
                <small>{p.track}</small>
                <a href={p.url} target="_blank" rel="noreferrer">
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      {b.otherWork && (
        <>
          <h4>Selected publication</h4>
          <ul>
            <li>
              <small>{b.otherWork.venue}</small>
              <a href={b.otherWork.url} target="_blank" rel="noreferrer">
                {b.otherWork.title}
              </a>
            </li>
          </ul>
        </>
      )}
      <h4>Suggested CHI ’26 reading</h4>
      <p>{b.reason}</p>
      <ul>
        {b.recommended.map((id) => {
          const p = papers.find((p) => p.id === id)!;
          return (
            <li key={id}>
              <small>{p.track}</small>
              <a href={p.url} target="_blank" rel="noreferrer">
                {p.title}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
