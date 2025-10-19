// Displays the current knowledge base and updates every 5 seconds
function LearnedAnswers() {
  const [kb, setKb] = useState({});

  useEffect(() => {
    const fetchKb = () => {
      fetch("http://localhost:5000/api/knowledgebase")
        .then((res) => res.json())
        .then((data) => setKb(data))
        .catch((err) => console.log(err));
    };

    fetchKb(); // fetch once on mount
    const interval = setInterval(fetchKb, 5000); // refresh every 5s
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Learned Answers</h1>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Question</th>
            <th>Answer</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(kb).map((q, idx) => (
            <tr key={idx}>
              <td>{q}</td>
              <td>{kb[q]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
