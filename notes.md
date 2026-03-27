git add .
git commit -m "commit msg" 
git push origin main




const BASICS_MCQ = {
  easy: [
    { q: 'A classical bit can be…', opts: ['0 or 1', 'Both 0 and 1', 'Neither'], ans: 0 },
    { q: 'A qubit in superposition is…', opts: ['Only 0', 'Only 1', 'Both 0 and 1'], ans: 2 },
    { q: 'What does |0⟩ represent?', opts: ['State 1', 'State 0', 'Superposition'], ans: 1 },
    { q: 'What collapses a qubit?', opts: ['Entanglement', 'Measurement', 'Teleportation'], ans: 1 },
    { q: 'H gate stands for…', opts: ['Hadamard', 'Harmonic', 'Heisenberg'], ans: 0 },
    { q: 'The Bloch Sphere north pole = …', opts: ['|1⟩', 'Superposition', '|0⟩'], ans: 2 },
    { q: '|α|² + |β|² = …', opts: ['0', '2', '1'], ans: 2 },
    { q: 'X gate does what?', opts: ['Flips qubit', 'Creates superposition', 'Measures'], ans: 0 },
    { q: 'Ket notation |ψ⟩ represents…', opts: ['Row vector', 'Probability', 'Column vector'], ans: 2 },
    { q: 'Classical gates are…', opts: ['Reversible', 'Irreversible', 'Quantum'], ans: 1 }
  ],
  medium: [
    { q: 'Which basis has states |+⟩ and |−⟩?', opts: ['Z-basis', 'Y-basis', 'X-basis'], ans: 2 },
    { q: '⟨0|0⟩ = ?', opts: ['0', '1', '√2'], ans: 1 },
    { q: '⟨0|1⟩ = ?', opts: ['1', '0', 'i'], ans: 1 },
    { q: 'Decoherence is caused by…', opts: ['Measurement only', 'H gate', 'Environment interaction'], ans: 2 },
    { q: 'Z gate changes…', opts: ['Amplitude', 'Phase of |1⟩', 'Basis'], ans: 1 },
    { q: 'CNOT flips target when control is…', opts: ['|0⟩', '|+⟩', '|1⟩'], ans: 2 },
    { q: 'φ (phi) in Bloch sphere controls…', opts: ['Probability', 'Phase', 'Amplitude'], ans: 1 },
    { q: 'S gate adds a phase of…', opts: ['π', 'π/4', 'π/2'], ans: 2 },
    { q: 'No-Cloning theorem was proved in…', opts: ['1984', '1982', '1991'], ans: 1 },
    { q: 'After decoherence, QBER…', opts: ['Decreases', 'Stays same', 'Increases'], ans: 2 }
  ],
  hard: [
    { q: 'If θ=π/2, the qubit is at the…', opts: ['North pole', 'South pole', 'Equator'], ans: 2 },
    { q: 'H²= ?', opts: ['H', 'Z', 'I (Identity)'], ans: 2 },
    { q: 'For BB84 security, QBER must be below…', opts: ['25%', '5%', '11%'], ans: 2 },
    { q: 'Tsirelson bound for Bell inequality is…', opts: ['|S|≤2', '|S|≤2√2', '|S|≤3'], ans: 1 },
    { q: 'CNOT|10⟩ = ?', opts: ['|10⟩', '|01⟩', '|11⟩'], ans: 2 },
    { q: 'Eve introducing errors in BB84 causes QBER=', opts: ['11%', '5%', '25%'], ans: 2 },
    { q: 'T gate = ?', opts: ['√X', '√S', '√Z'], ans: 1 },
    { q: 'Y gate matrix diagonal is…', opts: ['[1,1]', '[0,0]', 'not diagonal'], ans: 2 },
    { q: 'SWAP|01⟩ = ?', opts: ['|00⟩', '|11⟩', '|10⟩'], ans: 2 },
    { q: 'Which gate is used in teleportation correction?', opts: ['S or T', 'X or Z', 'H or CNOT'], ans: 1 }
  ]
};
