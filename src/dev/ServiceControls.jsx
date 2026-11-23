export default function ServiceControls({ resource, allowEmpty = true }) {
  const options = [
    ["normal", "Respuesta normal"],
    ["404", "Error 404"],
    ["500", "Error 500"],
    ["network", "Sin conexión"],
    ["slow", "Carga lenta (2,5 s)"],
    ...(allowEmpty ? [["empty", "Sin resultados"]] : []),
  ];
  return (
    <details className="service-controls">
      <summary>Probar estados del servicio</summary>
      <p>
        El estado se aplica al seleccionarlo. Puedes cambiarlo durante la carga
        o volver a probarlo con Actualizar consulta.
      </p>
      <div className="inline-actions">
        <label htmlFor="service-scenario">Respuesta de la API</label>
        <select
          id="service-scenario"
          value={resource.scenario}
          onChange={(event) => resource.changeScenario(event.target.value)}
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          className="button secondary"
          disabled={resource.isFetching}
          onClick={() => resource.refetch()}
        >
          Actualizar consulta
        </button>
      </div>
    </details>
  );
}
