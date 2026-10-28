import type { ReactNode } from "react";

export interface Siege {
  id: string;
  contenu: ReactNode;
  classe?: string;
  onClick?: () => void;
}

/** Une table ronde : les sièges sont répartis sur un cercle, le centre reçoit ce qu'on veut. */
export function Table({ sieges, centre }: { sieges: Siege[]; centre?: ReactNode }) {
  const n = sieges.length;
  return (
    <div className="table">
      <div className="table-plateau">{centre}</div>
      {sieges.map((s, i) => {
        const angle = (i / Math.max(n, 1)) * 2 * Math.PI - Math.PI / 2;
        const style = {
          left: `${50 + 41 * Math.cos(angle)}%`,
          top: `${50 + 41 * Math.sin(angle)}%`
        };
        const Balise = s.onClick ? "button" : "div";
        return (
          <Balise key={s.id} className={`siege ${s.classe ?? ""}`} style={style} onClick={s.onClick}>
            {s.contenu}
          </Balise>
        );
      })}
    </div>
  );
}
