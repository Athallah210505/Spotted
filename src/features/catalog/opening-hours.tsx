import { openingLabel, type GooglePlace } from "./google-data";
import styles from "./google-ui.module.css";

export function OpeningHours({ place }: { place: GooglePlace }) {
  if (!place.hours.length) return null;
  return (
    <details className={styles.hours}>
      <summary>
        <div>
          <b>Jam buka</b>
          <span>{openingLabel(place)}</span>
        </div>
      </summary>
      <table aria-label="Jam buka mingguan">
        <tbody>
          {place.hours.map((row) => (
            <tr key={row.day}>
              <th scope="row">{row.day}</th>
              <td>{row.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
