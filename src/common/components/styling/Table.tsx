import { Button } from "common/components/styling/Building";
import { Column, usePagination, useSortBy, useTable } from "react-table";

export default function Table<D extends Record<string, unknown>>(props: {
  columns: Array<Column<D>>;
  data: D[];
  textCentered?: boolean;
  fullwidth?: boolean;
  hoverable?: boolean;
  narrow?: boolean;
  paginated?: boolean;
}): JSX.Element {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    pageOptions,
    page,
    pageCount,
    state: { pageIndex, pageSize },
    gotoPage,
    previousPage,
    nextPage,
    setPageSize,
    canPreviousPage,
    canNextPage,
  } = useTable(
    {
      columns: props.columns,
      data: props.data,
      initialState: {
        pageSize: 50,
      },
    },
    useSortBy,
    usePagination
  );

  const classes = ["table"];
  if (props.textCentered) {
    classes.push("has-text-centered");
  }
  if (props.fullwidth) {
    classes.push("is-fullwidth");
  }
  if (props.hoverable) {
    classes.push("is-hoverable");
  }
  if (props.narrow) {
    classes.push("is-narrow");
  }

  const showedRows = props.paginated ? page : rows;
  const paginationControls = props.paginated ? (
    <div>
      <Button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
        {"<<"}
      </Button>
      <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
        {"<"}
      </Button>
      <Button onClick={() => nextPage()} disabled={!canNextPage}>
        {">"}
      </Button>
      <Button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
        {">>"}
      </Button>
      <Button static>
        Page&nbsp;
        <strong>
          {pageIndex + 1} of {pageOptions.length}
        </strong>{" "}
      </Button>
      <Button static>Go to page:</Button>
      <span>
        <input
          type="number"
          className="input"
          defaultValue={pageIndex + 1}
          onChange={(e) => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            gotoPage(page);
          }}
          style={{ width: "100px" }}
        />
      </span>
      <div className="select">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 25, 50, 100, 500, 2500].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  ) : (
    <></>
  );

  return (
    <>
      <div className="table-container">
        <table {...getTableProps()} className={classes.join(" ")}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={Math.random()}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps([
                      column.getSortByToggleProps(),
                      {
                        className: column.className,
                      },
                    ])}
                    key={Math.random()}
                  >
                    {column.render("Header")}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " 🔽"
                          : " 🔼"
                        : ""}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {showedRows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={Math.random()}>
                  {row.cells.map((cell) => {
                    return (
                      <td
                        {...cell.getCellProps([
                          {
                            className: cell.column.className,
                          },
                        ])}
                        key={Math.random()}
                      >
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {paginationControls}
    </>
  );
}
