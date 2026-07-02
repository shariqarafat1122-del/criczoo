import { useEffect, useState } from "react";

export default function LiveTrainPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/train/status?trainNo=55307");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <h2>Loading...</h2>;

  if (!data) return <h2>No Data</h2>;

  const live = data.props.pageProps.ltsData;
  const route = data.props.pageProps.timeTableData[0].route;

  return (
    <div style={{ padding: 20 }}>
      <h1>{live.train_name}</h1>

      <p>
        <b>Train No:</b> {live.train_number}
      </p>

      <p>
        <b>Status:</b> {live.title}
      </p>

      <p>{live.new_message}</p>

      <p>
        <b>Source:</b> {live.source_stn_name}
      </p>

      <p>
        <b>Destination:</b> {live.dest_stn_name}
      </p>

      <p>
        <b>Next Station:</b> {live.next_station_name}
      </p>

      <p>
        <b>Platform:</b> {live.platform_number}
      </p>

      <hr />

      <h2>Route</h2>

      {route.map((station: any) => (
        <div
          key={station.station_code}
          style={{
            border: "1px solid #ddd",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <h3>{station.station_name}</h3>

          <p>Code: {station.station_code}</p>

          <p>Platform: {station.platform_number}</p>

          <p>Arrival: {station.sta_min}</p>

          <p>Departure: {station.std_min}</p>

          <p>Distance: {station.distance_from_source} km</p>
        </div>
      ))}
    </div>
  );
}
