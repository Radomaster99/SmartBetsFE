'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, type Table } from '@tanstack/react-table';
import type { StandingDto } from '@/lib/types/api';
import { TeamLogo } from '@/components/shared/TeamLogo';

interface Props {
  standings: StandingDto[];
  resolveTeamHref?: (standing: StandingDto) => string | null;
  onTeamNavigate?: (standing: StandingDto) => void;
}

const columnHelper = createColumnHelper<StandingDto>();

function FormDots({ form }: { form: string }) {
  if (!form) {
    return null;
  }

  const results = form.replace(/[^WDL]/gi, '').split('').slice(-5);

  return (
    <div className="flex items-center gap-0.5">
      {results.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black"
          style={{
            background:
              result.toUpperCase() === 'W'
                ? '#00e676'
                : result.toUpperCase() === 'D'
                  ? '#f59e0b'
                  : '#ef5350',
            color: '#000',
          }}
        >
          {result.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

export function StandingsTable({ standings, resolveTeamHref, onTeamNavigate }: Props) {
  const rankColumn = useMemo(
    () =>
      columnHelper.accessor('rank', {
        header: '#',
        cell: (context) => (
          <span className="inline-block w-5 text-center text-[13px] font-bold" style={{ color: 'var(--t-text-4)' }}>
            {context.getValue()}
          </span>
        ),
      }),
    [],
  );

  const teamColumn = useMemo(
    () =>
      columnHelper.display({
        id: 'team',
        header: 'Team',
        cell: ({ row }) => {
          const href = resolveTeamHref?.(row.original) ?? null;

          const content = (
            <div className="flex items-center gap-2">
              <TeamLogo src={row.original.teamLogoUrl} alt={row.original.teamName} size={20} />
              <span className="text-[13px] font-medium" style={{ color: 'var(--t-text-1)' }}>
                {row.original.teamName}
              </span>
            </div>
          );

          if (!href) {
            return content;
          }

          return (
            <Link
              href={href}
              onClick={() => onTeamNavigate?.(row.original)}
              className="transition-colors hover:opacity-90"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {content}
            </Link>
          );
        },
      }),
    [onTeamNavigate, resolveTeamHref],
  );

  const playedColumn = useMemo(
    () =>
      columnHelper.accessor('played', {
        header: 'P',
        cell: (context) => <span className="text-[12px]" style={{ color: 'var(--t-text-3)' }}>{context.getValue()}</span>,
      }),
    [],
  );

  const winColumn = useMemo(
    () =>
      columnHelper.accessor('win', {
        header: 'W',
        cell: (context) => <span className="text-[12px] font-semibold" style={{ color: '#00e676' }}>{context.getValue()}</span>,
      }),
    [],
  );

  const drawColumn = useMemo(
    () =>
      columnHelper.accessor('draw', {
        header: 'D',
        cell: (context) => <span className="text-[12px]" style={{ color: '#f59e0b' }}>{context.getValue()}</span>,
      }),
    [],
  );

  const loseColumn = useMemo(
    () =>
      columnHelper.accessor('lose', {
        header: 'L',
        cell: (context) => <span className="text-[12px]" style={{ color: '#ef5350' }}>{context.getValue()}</span>,
      }),
    [],
  );

  const goalsForColumn = useMemo(
    () =>
      columnHelper.accessor('goalsFor', {
        header: 'GF',
        cell: (context) => <span className="text-[12px]" style={{ color: 'var(--t-text-3)' }}>{context.getValue()}</span>,
      }),
    [],
  );

  const goalsAgainstColumn = useMemo(
    () =>
      columnHelper.accessor('goalsAgainst', {
        header: 'GA',
        cell: (context) => <span className="text-[12px]" style={{ color: 'var(--t-text-3)' }}>{context.getValue()}</span>,
      }),
    [],
  );

  const goalsDiffColumn = useMemo(
    () =>
      columnHelper.accessor('goalsDiff', {
        header: 'GD',
        cell: (context) => {
          const value = context.getValue();

          return (
            <span
              className="text-[12px] font-medium"
              style={{ color: value > 0 ? '#00e676' : value < 0 ? '#ef5350' : 'var(--t-text-4)' }}
            >
              {value > 0 ? `+${value}` : value}
            </span>
          );
        },
      }),
    [],
  );

  const pointsColumn = useMemo(
    () =>
      columnHelper.accessor('points', {
        header: 'Pts',
        cell: (context) => <span className="text-[13px] font-black" style={{ color: 'var(--t-text-1)' }}>{context.getValue()}</span>,
      }),
    [],
  );

  const formColumn = useMemo(
    () =>
      columnHelper.accessor('form', {
        header: 'Form',
        cell: (context) => <FormDots form={context.getValue()} />,
      }),
    [],
  );

  const descriptionColumn = useMemo(
    () =>
      columnHelper.accessor('description', {
        header: '',
        cell: (context) => {
          const value = context.getValue();

          if (!value) {
            return null;
          }

          const normalizedValue = value.toLowerCase();
          const isPromotion = normalizedValue.includes('promot') || normalizedValue.includes('champi');
          const isRelegation = normalizedValue.includes('relega');

          return (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{
                background: isPromotion
                  ? 'rgba(0,230,118,0.15)'
                  : isRelegation
                    ? 'rgba(239,83,80,0.15)'
                    : 'var(--t-surface-2)',
                color: isPromotion ? '#00e676' : isRelegation ? '#ef5350' : 'var(--t-text-4)',
              }}
            >
              {value.length > 12 ? `${value.slice(0, 12)}...` : value}
            </span>
          );
        },
      }),
    [],
  );

  const desktopColumns = useMemo(
    () => [
      rankColumn,
      teamColumn,
      playedColumn,
      winColumn,
      drawColumn,
      loseColumn,
      goalsForColumn,
      goalsAgainstColumn,
      goalsDiffColumn,
      pointsColumn,
      formColumn,
      descriptionColumn,
    ],
    [
      descriptionColumn,
      drawColumn,
      formColumn,
      goalsAgainstColumn,
      goalsDiffColumn,
      goalsForColumn,
      loseColumn,
      playedColumn,
      pointsColumn,
      rankColumn,
      teamColumn,
      winColumn,
    ],
  );

  const mobileColumns = useMemo(
    () => [
      rankColumn,
      teamColumn,
      playedColumn,
      winColumn,
      drawColumn,
      loseColumn,
      pointsColumn,
      goalsDiffColumn,
      goalsForColumn,
      goalsAgainstColumn,
      formColumn,
      descriptionColumn,
    ],
    [
      descriptionColumn,
      drawColumn,
      formColumn,
      goalsAgainstColumn,
      goalsDiffColumn,
      goalsForColumn,
      loseColumn,
      playedColumn,
      pointsColumn,
      rankColumn,
      teamColumn,
      winColumn,
    ],
  );

  const desktopTable = useReactTable({
    data: standings,
    columns: desktopColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const mobileTable = useReactTable({
    data: standings,
    columns: mobileColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderTable = (table: Table<StandingDto>) => (
    <table className="w-full">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--t-text-6)' }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>

      <tbody>
        {table.getRowModel().rows.map((row, index) => (
          <tr
            key={row.id}
            className="transition-colors"
            style={{
              borderBottom: '1px solid var(--t-border)',
              background: index % 2 === 0 ? 'transparent' : 'var(--t-page-bg)',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = 'var(--t-surface-2)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'var(--t-page-bg)';
            }}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-3 py-2.5">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <div
        className="overflow-x-auto rounded-xl md:hidden"
        style={{ border: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
      >
        {renderTable(mobileTable)}
      </div>

      <div
        className="hidden overflow-x-auto rounded-xl md:block"
        style={{ border: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
      >
        {renderTable(desktopTable)}
      </div>
    </>
  );
}
