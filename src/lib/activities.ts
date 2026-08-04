export type ActivityKind = 'intuition' | 'linear-algebra' | 'systems' | 'markov' | 'cryptography';

export type ActivityMeta = {
  slug: string;
  title: string;
  short: string;
  figure: string;
  kind: ActivityKind;
  topic: string;
  minutes: number;
};

export const ACTIVITIES: ActivityMeta[] = [
  { slug: 'aryabhata-quadratic', title: "Function Machine — f(x) = x² − 10", short: 'A function machine, but the input is squared and 10 is subtracted before the answer drops out.', figure: 'Aryabhata', kind: 'intuition', topic: 'Quadratic Functions', minutes: 4 },
  { slug: 'bharavi-3d-line', title: "Bharavi's Line — Every Point of the Form β(2, 7, 3)", short: 'Stretch the scalar β from −3 to 3 and watch the line sweep through 3D space.', figure: 'Bharavi', kind: 'linear-algebra', topic: 'Lines through the Origin in 3D', minutes: 4 },
  { slug: 'bharavi-magha-savings-graph', title: "Bharavi & Magha's Contest — Direct Proportion", short: 'Two poets race to save verses. The first to reach 1,000 wins. Plot the race.', figure: 'Bharavi & Magha', kind: 'intuition', topic: 'Linear Equations in Two Variables', minutes: 5 },
  { slug: 'bhaskara-cubic-find-x', title: "Bhāskara's Challenge — Find x when g(x) = −22", short: 'Given a cubic g(x), reverse it: which input produces the value −22?', figure: 'Bhāskara', kind: 'intuition', topic: 'Cubic Equations', minutes: 4 },
  { slug: 'bhaskaracharya-cubic', title: "Bhāskara's Cubic — g(x) = ax³ + bx² + cx + d", short: 'Twist four knobs a, b, c, d and see how each one warps the cubic curve.', figure: 'Bhāskara', kind: 'intuition', topic: 'Cubic Functions', minutes: 4 },
  { slug: 'bhavabhuti-range-of-B', title: "Bhavabhuti's Range — What does B = [[1,2],[2,4]] actually output?", short: 'A singular 2×2 matrix B acts on a unit square — its image is a line, not the whole plane.', figure: 'Bhavabhuti', kind: 'linear-algebra', topic: 'Range (Image) of a Singular Matrix', minutes: 5 },
  { slug: 'bhavabhuti-singular-matrix', title: "Bhavabhuti's Singular Map — B = [[1,2],[2,4]]", short: 'Pick any input vector and watch the singular B map it onto a hidden line.', figure: 'Bhavabhuti', kind: 'linear-algebra', topic: 'Singular Matrices & Fibers', minutes: 5 },
  { slug: 'brahmagupta-balance', title: "Brahmagupta's Balance — One Equation, Three Unknowns", short: 'An underdetermined system: one equation, three weights, infinitely many solutions.', figure: 'Brahmagupta', kind: 'systems', topic: 'Underdetermined Systems', minutes: 4 },
  { slug: 'chanakya-audit', title: "Chanakya's Audit — Three Equations, Two Unknowns", short: 'Three ledgers must agree. When they cannot, discover the geometry of inconsistency.', figure: 'Chanakya', kind: 'systems', topic: 'Overdetermined Systems', minutes: 5 },
  { slug: 'chanakya-bookclub-line', title: "Chanakya's Tax System — y = ax + b", short: 'A linear tax model y = ax + b. Find the intercept, the slope, and reverse the formula.', figure: 'Chanakya', kind: 'intuition', topic: 'Linear Equations in Two Variables', minutes: 4 },
  { slug: 'charaka-perpendicular-vectors', title: "Charaka's Vectors — What is Perpendicular to [1, 1]?", short: 'Find every vector in ℝ² that is perpendicular to [1, 1]. The answer is a whole line.', figure: 'Charaka', kind: 'linear-algebra', topic: 'Vectors & Perpendicularity', minutes: 4 },
  { slug: 'collapse-dimension', title: 'B Collapses a Dimension — The Rank-Nullity Theorem', short: 'Watch a linear map collapse 3D into 2D, and discover why dim nullspace + dim range = 3.', figure: 'Sūrya', kind: 'linear-algebra', topic: 'The Fundamental Insight', minutes: 5 },
  { slug: 'collapsing-lines', title: 'Collapsing Lines — The Geometry of a Rank-1 Matrix', short: 'A rank-1 matrix takes a whole parallelogram and squashes it into a single line segment.', figure: 'Sūrya', kind: 'linear-algebra', topic: 'Rank-1 Mapping', minutes: 4 },
  { slug: 'gargi-matrix-loom', title: "Gargi's Matrix Loom — The Matrix as a Function", short: 'A 2×2 matrix is a function. Pick an input vector and see exactly where the loom sends it.', figure: 'Gargi', kind: 'linear-algebra', topic: 'Matrix as a Function', minutes: 5 },
  { slug: 'hill-cipher', title: 'Hill Cipher — Encrypting with Matrices', short: 'Encrypt the word HELP using a 2×2 key matrix. Then decode the ciphertext back.', figure: 'Cryptography', kind: 'cryptography', topic: 'Hill Cipher', minutes: 5 },
  { slug: 'jayadeva-cafe-equations', title: "Jayadeva's Cafe — Solving 3A + C = 1200, A + 2C = 1000", short: 'A cafe sells only two things: A and C. Two constraints give a unique solution.', figure: 'Jayadeva', kind: 'systems', topic: 'Simultaneous Systems', minutes: 5 },
  { slug: 'kalidasa-verses-line', title: "Kālidāsa's Verses — f(x) = ax + b", short: 'Given f(x) = ax + b, find the inverse: which day x gives exactly T total verses?', figure: 'Kālidāsa', kind: 'intuition', topic: 'Inverse Functions', minutes: 4 },
  { slug: 'markov-city-chain', title: 'City Chain — 3-State Markov Chain', short: 'A walker moves between three cities by a fixed transition matrix. Where do they end up?', figure: 'Markov', kind: 'markov', topic: '3-State Chains', minutes: 5 },
  { slug: 'markov-mood-chain', title: 'Markov Mood Chain — Steady States from Transitions', short: 'A mood has three states. Run the chain a thousand times and watch it converge.', figure: 'Markov', kind: 'markov', topic: 'Steady State', minutes: 5 },
  { slug: 'nagarjuna-matrix-function', title: "Nāgārjuna's Matrix Function — M: ℝ² → ℝ²", short: 'Each matrix M is a function from ℝ² to ℝ². Plot every point in a grid to see the image.', figure: 'Nāgārjuna', kind: 'linear-algebra', topic: 'Matrices as Functions', minutes: 5 },
  { slug: 'nagarjuna-slope-peaks', title: "Nāgārjuna's Peaks — Comparing Slopes", short: 'Two mountain paths. Which has the steeper slope? Measure them with rise over run.', figure: 'Nāgārjuna', kind: 'intuition', topic: 'Slope of a Line', minutes: 3 },
  { slug: 'nullspace-line', title: 'The Nullspace — Hidden Line of the Matrix', short: 'The set of all vectors a matrix sends to zero. For a 2×2, it is often a hidden line.', figure: 'Vyāsa', kind: 'linear-algebra', topic: 'Nullspace', minutes: 4 },
  { slug: 'orthogonal-complements', title: 'The Right Angle — Row Space ⟂ Nullspace', short: 'The row space and the null space of any matrix are always perpendicular. See why.', figure: 'Vyāsa', kind: 'linear-algebra', topic: 'Fundamental Theorem of Linear Algebra', minutes: 5 },
  { slug: 'panini-dimensions', title: "Panini's Grammar of Space — ℝ, ℝ², ℝ³", short: 'From a point (ℝ) to a plane (ℝ²) to a volume (ℝ³). Why does dimension count?', figure: 'Pāṇini', kind: 'intuition', topic: 'Dimensions of Space', minutes: 4 },
  { slug: 'panini-linear-map', title: "Panini's Transformations — ϕ: ℝ² → ℝ²", short: 'A linear map is a transformation. Apply it to the four corners of a square.', figure: 'Pāṇini', kind: 'linear-algebra', topic: 'Linear Maps ℝⁿ → ℝⁿ', minutes: 5 },
  { slug: 'patanjali-three-subspaces', title: "Patanjali's Three Sets — Column Space, Row Space, Null Space", short: 'Three sets born from one matrix. Their dimensions add up to a theorem.', figure: 'Patañjali', kind: 'linear-algebra', topic: 'Three Fundamental Subspaces', minutes: 5 },
  { slug: 'spanning-plane', title: 'Spanning the Plane — Two Vectors Generate a Subspace', short: 'Two vectors u, v span a plane through the origin. Stretch their coefficients to draw it.', figure: 'Patañjali', kind: 'linear-algebra', topic: 'Span', minutes: 4 },
  { slug: 'surya-singular-matrix', title: "Sūrya's Singular Eclipse — When a Matrix Collapses", short: 'A singular matrix has zero determinant. The eclipse blocks one whole dimension.', figure: 'Sūrya', kind: 'intuition', topic: 'Singular Matrices', minutes: 4 },
  { slug: 'sushruta-vector-hunt', title: "Sushruta's Vector Hunt — Find all [x; y] with [1 1][x; y] = 0", short: 'The dot product with [1, 1] equals zero. Which pairs (x, y) qualify? An entire line.', figure: 'Suśruta', kind: 'linear-algebra', topic: 'Matrix Multiplication', minutes: 4 },
  { slug: 'tenali-birbal-fruit-stall', title: 'Fruit Stall — Systems & Matrices', short: 'A vendor sells apples and mangoes. Set up two equations and solve with a matrix.', figure: 'Tenali & Bīrbal', kind: 'intuition', topic: 'Systems of Linear Equations', minutes: 4 },
  { slug: 'tenali-number-trick', title: "Tenali's Number Trick — What is f(5)?", short: 'A function f(x) takes a secret formula. Plug in x = 5 and read the output.', figure: 'Tenali', kind: 'intuition', topic: 'Functions and Graphs', minutes: 3 },
  { slug: 'tulsidas-cafe-overdetermined', title: "Tulsidas's Cafe — When Three Equations Beat Two Unknowns", short: 'Three equations, two unknowns. The system can be inconsistent. Detect it geometrically.', figure: 'Tulsīdās', kind: 'linear-algebra', topic: 'Overdetermined Systems', minutes: 5 },
  { slug: 'varahamihira-collinear-houses', title: "Varāhamihira's Observatory — Are the Points Collinear?", short: 'Three celestial houses sit on a map. Are they on the same line? Test with a determinant.', figure: 'Varāhamihira', kind: 'intuition', topic: 'Linear Equations in Two Variables', minutes: 4 },
  { slug: 'varahamihira-star-map', title: "Varāhamihira's Star Map — Linear Transformations in ℝ²", short: 'A 2×2 transformation rotates, scales, and skews a star map. Try every matrix.', figure: 'Varāhamihira', kind: 'intuition', topic: 'Linear Transformations', minutes: 5 },
  { slug: 'vidyapati-3d-line', title: "Vidyapati's Line — Points of the form α(1, 2, 1)", short: 'A single direction vector (1, 2, 1) defines a line through the origin in 3D.', figure: 'Vidyāpati', kind: 'linear-algebra', topic: 'Lines through the Origin in 3D', minutes: 4 },
  { slug: 'vikramaditya-coin-jar', title: "Vikramaditya's Coin Jar — Does the Line Pass Through the Origin?", short: 'A line of the form y = mx + b. Decide if b = 0 (through origin) or not.', figure: 'Vikramāditya', kind: 'intuition', topic: 'Linear Equations in Two Variables', minutes: 3 },
  { slug: 'vyasa-perpendicular-plane', title: "Vyasa's Plane — Every (x, y, z) Perpendicular to W", short: 'A normal vector W defines a plane. Every point in the plane is perpendicular to W.', figure: 'Vyāsa', kind: 'linear-algebra', topic: 'Perpendicular Plane in 3D', minutes: 4 },
];

export const ACTIVITY_BY_SLUG: Record<string, ActivityMeta> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.slug, a]),
);

export const KIND_LABELS: Record<ActivityKind, string> = {
  intuition: 'Intuition Builder',
  'linear-algebra': 'Linear Algebra',
  systems: 'Systems',
  markov: 'Markov Chain',
  cryptography: 'Cryptography',
};

export function getActivity(slug: string): ActivityMeta | undefined {
  return ACTIVITY_BY_SLUG[slug];
}