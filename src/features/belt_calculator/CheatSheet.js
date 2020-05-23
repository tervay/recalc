import React from "react";

export default function CheatSheet() {
  const Pulley = (vendor, type, pitch, width, teeth, bore, pd) => {
    return {
      vendor,
      type,
      pitch,
      width,
      teeth,
      bore,
      pd,
    };
  };

  const data = [
    Pulley("VEXPro, WCP", "GT2", 3, 9, 12, "RS550", 0.451),
    Pulley("VEXPro, WCP", "GT2", 3, 9, 12, "RS775", 0.451),
    Pulley("VEXPro, WCP", "GT2", 3, 9, 12, "BAG", 0.451),
    Pulley("VEXPro, WCP", "GT2", 3, 9, 16, "Falcon", 0.601),
    Pulley("VEXPro, WCP", "GT2", 3, 9, 24, '1/2" Hex', 0.902),
    Pulley("VEXPro, WCP", "GT2", 3, 9, 36, '1/2" Hex', 1.353),
    Pulley("VEXPro, WCP", "GT2", 3, 9, 48, '1/2" Hex', 1.805),
    Pulley("VEXPro, WCP", "GT2", 3, 9, 60, '1/2" Hex', 2.256),
    Pulley("VEXPro, WCP", "HTD", 5, "9, 15", 18, '1/2" Hex', 1.26),
    Pulley("VEXPro, WCP", "HTD", 5, "9, 15", 24, '1/2" Hex', 1.654),
    Pulley("VEXPro, WCP", "HTD", 5, "9, 15", 30, '1/2" Hex', 2.008),
    Pulley("VEXPro, WCP", "HTD", 5, "9, 15", 36, '1/2" Hex', 2.256),
    Pulley("WCP", "HTD", 5, "9, 15", 12, "CIM (8mm)", 0.752),
    Pulley("AndyMark", "HTD", 5, 9, 24, '1/2" Hex', 1.504),
    Pulley("AndyMark", "HTD", 5, 9, 24, '3/8" Hex', 1.504),
    Pulley("AndyMark", "HTD", 5, 9, 24, "6mm", 1.504),
    Pulley("AndyMark", "HTD", 5, 9, 30, "CIM (8mm)", 1.91),
    Pulley("AndyMark", "HTD", 5, 15, 39, '1/2" Hex', 2.44),
    Pulley("AndyMark", "HTD", 5, 15, 39, '1/2" Round', 2.44),
    Pulley("AndyMark", "HTD", 5, 15, 42, '0.95"', 2.632),
  ];

  return (
    <table className="table is-hoverable is-narrow">
      <thead>
        <tr>
          <th>Vendor</th>
          <th>Type</th>
          <th>Pitch</th>
          <th>Width</th>
          <th>Teeth</th>
          <th>Bore</th>
          <th>
            <abbr title="Pitch Diameter">PD</abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((pulley) => {
          return (
            <tr key={pulley.vendor + pulley.teeth + pulley.bore}>
              <td>{pulley.vendor}</td>
              <td>{pulley.type}</td>
              <td>{pulley.pitch} mm</td>
              <td>{pulley.width} mm</td>
              <td>{pulley.teeth}T</td>
              <td>{pulley.bore}</td>
              <td>{pulley.pd}"</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
