// Power Fx in Power Automate desktop flows: the 130 functions Microsoft lists in
// "Formula reference – desktop flows". Descriptions are shared with the Power Apps
// reference; examples are rewritten for desktop flows (they start with "=").
import type { Example, RefItem } from './types';
import { categories as allCategories, docsBase, formulas } from './power-apps-formulas';

export { docsBase };

const NAMES = `Abs Acos Acot AddColumns And Asin Atan Atan2 Average Blank Boolean Char Clear ClearCollect Coalesce Collect Concat Concatenate Cos Cot Count CountA CountIf CountRows Date DateAdd DateDiff DateTime DateTimeValue DateValue Day Dec2Hex Decimal Degrees Distinct DropColumns EDate EOMonth EncodeHTML EncodeUrl EndsWith Error Exp Filter Find First FirstN Float ForAll GUID Hex2Dec Hour If IfError Index Int IsBlank IsBlankOrError IsEmpty IsError IsNumeric IsToday Language Last LastN Left Len Ln Log LookUp Lower Max Mid Min Minute Mod Month Not Now Or Patch Pi PlainText Power Proper Radians Rand RandBetween Remove RenameColumns Replace Right Round RoundDown RoundUp Search Second Sequence Set ShowColumns Shuffle Sin Sort SortByColumns Split Sqrt StartsWith StdevP Substitute Sum Summarize Switch Table Tan Text Time TimeValue TimeZoneOffset Today Trim TrimEnds Trunc UniChar Upper Value VarP WeekNum Weekday With Year`.split(' ');

// Functions only documented here (not in the canvas-app list).
const EXTRA: RefItem[] = [
  {
    name: 'Decimal',
    category: 'Conversion',
    summary: 'Converts text to a decimal number, keeping exact decimal precision.',
    syntax: 'Decimal(String [, LanguageTag])',
    examples: [{ code: `=Decimal("19.99")`, result: '19.99' }],
    tags: ['to number', 'precision', 'money'],
    docs: 'function-value',
  },
  {
    name: 'Summarize',
    category: 'Table',
    summary: 'Groups the rows of a table by one or more columns and calculates values for each group.',
    syntax: 'Summarize(Table, GroupByColumn1 [, GroupByColumn2, ...] [, Formula As Name, ...])',
    examples: [
      {
        code: `=Summarize(Table({Region: "East", Amount: 10}, {Region: "East", Amount: 5}, {Region: "West", Amount: 7}), Region, Sum(ThisGroup, Amount) As Total)`,
        result: 'East 15, West 7',
      },
    ],
    notes: ['ThisGroup holds the rows of the current group. Name every calculated column with As.'],
    tags: ['group by', 'totals', 'aggregate', 'pivot'],
    docs: 'function-summarize',
  },
];

// Desktop-flow examples where the Power Apps ones refer to canvas controls or data sources.
const EXAMPLES: Record<string, Example[]> = {
  AddColumns: [{ code: `=AddColumns(Table({Item: "Pen", Qty: 2, Price: 1.5}), Total, Qty * Price)`, result: 'The table with a Total column (3)' }],
  Average: [{ code: `=Average(10, 20, 30)`, result: '20' }],
  Blank: [{ code: `=Blank()`, result: 'An empty value, for clearing a variable' }],
  ClearCollect: [{ code: `=ClearCollect(OrderList, Table({Order: "A-1"}, {Order: "A-2"}))`, result: 'Replaces everything in OrderList' }],
  Coalesce: [{ code: `=Coalesce(Nickname, FullName, "Guest")`, result: 'The first value that isn’t empty' }],
  Concatenate: [{ code: `=Concatenate("Report_", Text(Today(), "yyyy-mm-dd"), ".xlsx")`, result: '"Report_2026-10-23.xlsx"' }],
  Count: [{ code: `=Count([4, 7, Blank()])`, result: '2' }],
  CountA: [{ code: `=CountA(["a", Blank(), "b"])`, result: '2' }],
  CountIf: [{ code: `=CountIf([5, 12, 30, 8], Value > 10)`, result: '2' }],
  CountRows: [{ code: `=CountRows(Table({Name: "Ada"}, {Name: "Ben"}))`, result: '2' }],
  DateDiff: [{ code: `=DateDiff(Date(2026, 1, 1), Date(2026, 10, 23), TimeUnit.Days)`, result: '295' }],
  Distinct: [{ code: `=Distinct(["Red", "Blue", "Red"], Value)`, result: 'Red, Blue' }],
  EncodeUrl: [{ code: `=EncodeUrl("power automate desktop")`, result: '"power%20automate%20desktop"' }],
  EndsWith: [{ code: `=EndsWith(FileName, ".pdf")`, result: 'true for PDF files' }],
  Error: [{ code: `=Error({Kind: ErrorKind.Validation, Message: "Invoice number is missing"})`, result: 'Raises your own error' }],
  Filter: [{ code: `=Filter([5, 12, 30, 8], Value > 10)`, result: '12, 30' }],
  First: [{ code: `=First(["a", "b", "c"]).Value`, result: '"a"' }],
  FirstN: [{ code: `=FirstN([1, 2, 3, 4, 5], 3)`, result: '1, 2, 3' }],
  ForAll: [{ code: `=ForAll([1, 2, 3], Value * 10)`, result: '10, 20, 30' }],
  IfError: [{ code: `=IfError(Value(InputText), 0)`, result: '0 when the text isn’t a number' }],
  IsBlank: [{ code: `=IsBlank(CustomerEmail)`, result: 'true when the variable is empty' }],
  IsBlankOrError: [{ code: `=IsBlankOrError(Value(InputText))`, result: 'true for empty or non-numeric text' }],
  IsError: [{ code: `=IsError(Value("abc"))`, result: 'true' }],
  IsNumeric: [{ code: `=IsNumeric("42")`, result: 'true' }],
  IsToday: [{ code: `=IsToday(InvoiceDate)`, result: 'true when the invoice is dated today' }],
  Len: [{ code: `=Len("Power Automate")`, result: '14' }],
  LookUp: [{ code: `=LookUp(Table({Code: "IN", Name: "India"}, {Code: "FR", Name: "France"}), Code = "FR").Name`, result: '"France"' }],
  Max: [{ code: `=Max(4, 9, 2)`, result: '9' }],
  Min: [{ code: `=Min(4, 9, 2)`, result: '2' }],
  Not: [{ code: `=Not(IsBlank(OrderId))`, result: 'true when OrderId has a value' }],
  Now: [{ code: `=Text(Now(), "yyyy-mm-dd hh-mm")`, result: 'A timestamp safe for file names' }],
  Today: [{ code: `=Text(Today(), "dd/mm/yyyy")`, result: '"23/10/2026"' }],
  Patch: [{ code: `=Patch({Name: "Ada", Score: 70}, {Score: 95})`, result: '{Name: "Ada", Score: 95}' }],
  PlainText: [{ code: `=PlainText("<p>Hello <b>world</b></p>")`, result: '"Hello world"' }],
  Remove: [{ code: `=Remove(OrderList, First(OrderList))`, result: 'Removes the first item from OrderList' }],
  Set: [
    { code: `=Set(Index(Index(DataTable, 1), 1), 42)`, result: 'Puts 42 in the first cell of a data table' },
    { code: `=Set(customObject.status, "Done")`, result: 'Updates one property of a custom object' },
  ],
  Search: [{ code: `=Search(Table({Name: "Contoso"}, {Name: "Fabrikam"}), "con", Name)`, result: 'The Contoso row' }],
  ShowColumns: [{ code: `=ShowColumns(Table({Name: "Ada", Email: "ada@contoso.com", Notes: "VIP"}), Name, Email)`, result: 'Only Name and Email' }],
  Sort: [{ code: `=Sort([3, 1, 2], Value)`, result: '1, 2, 3' }],
  SortByColumns: [{ code: `=SortByColumns(Table({Name: "Ben"}, {Name: "Ada"}), Name)`, result: 'Ada, Ben' }],
  StartsWith: [{ code: `=StartsWith(FileName, "INV-")`, result: 'true for invoice files' }],
  StdevP: [{ code: `=StdevP(2, 4, 4, 4, 5, 5, 7, 9)`, result: '2' }],
  Switch: [{ code: `=Switch(StatusCode, 200, "OK", 404, "Not found", "Error")`, result: 'A label for an HTTP status code' }],
  Upper: [{ code: `=Upper(CountryCode)`, result: '"IN" from "in"' }],
  VarP: [{ code: `=VarP(2, 4, 4, 4, 5, 5, 7, 9)`, result: '4' }],
};

// Extra notes that matter in desktop flows.
const NOTES: Record<string, string[]> = {
  Index: ['Desktop flows count from 1: Index(List, 1) is the first item.'],
  Collect: ['Use it in the Run Power Fx expression action to add items to a typed list.'],
  ClearCollect: ['Use it in the Run Power Fx expression action.'],
  Clear: ['Use it in the Run Power Fx expression action.'],
  Remove: ['Use it in the Run Power Fx expression action.'],
  Set: ['In desktop flows, Set can update a list item or object property, for example =Set(customObject.property, 17). Use the Set variable action for plain variables.'],
  Now: ['Uses the clock and time zone of the machine running the flow.'],
};

// Power Apps examples and notes that only make sense in canvas apps are dropped.
const CANVAS =
  /\.Text\b|\.Selected|ThisItem|Gallery|\btxt[A-Z]|\bdd[A-Z]|\bfrm[A-Z]|\bdp[A-Z]|\bcmb|Navigate|Notify|Screen|User\(\)|Self\.|Parent\.|Location|Connection|Tasks|Contacts|Orders|Products|Employees|Invoices|Reviews|Scores|Quotes|Tickets|Sales|Requests|Visits|Archive|OrderLines|Users\b/;
const CANVAS_NOTE = /delegab|gallery|control|screen|label|data source|App\.|the app|multiline/i;

const byName = new Map(formulas.map((f) => [f.name, f]));

export const desktopFormulas: RefItem[] = NAMES.map((name) => {
  const base = byName.get(name) ?? EXTRA.find((e) => e.name === name);
  if (!base) throw new Error(`Missing base entry for ${name}`);
  const examples = EXAMPLES[name] ?? base.examples.filter((e) => !CANVAS.test(e.code)).map((e) => ({ ...e, code: e.code.startsWith('=') ? e.code : `=${e.code}` }));
  const notes = [...(base.notes ?? []).filter((n) => !CANVAS_NOTE.test(n)), ...(NOTES[name] ?? [])];
  return { ...base, examples, notes: notes.length ? notes : undefined };
}).sort((a, b) => a.name.localeCompare(b.name));

const used = new Set(desktopFormulas.map((f) => f.category));
export const categories = allCategories.filter((c) => used.has(c.name));
