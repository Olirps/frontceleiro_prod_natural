import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    onRowsChange,
    rowsPerPage,
    rowsPerPageOptions = [10, 25, 50],
}) => {
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handlePageInputChange = (e) => {
        const page = Number(e.target.value);
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const handleRowsChange = (e) => {
        onRowsChange(Number(e.target.value));
    };

    return (
        <div>
            <div id="pagination-container">
                <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                >
                    Anterior
                </button>
                <span>Página </span>
                <input
                    type="number"
                    value={currentPage}
                    onChange={handlePageInputChange}
                    min={1}
                    max={totalPages}
                    aria-label="Número da página"
                />
                <span> de {totalPages}</span>
                <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    aria-label="Próxima página"
                >
                    Próxima
                </button>
            </div>
            <div id="show-more-container">
                <label htmlFor="rows-select">Mostrar</label>
                <select
                    id="rows-select"
                    value={rowsPerPage}
                    onChange={handleRowsChange}
                    aria-label="Linhas por página"
                >
                    {rowsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <label htmlFor="rows-select">por página</label>
            </div>
        </div>
    );
};

Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    onRowsChange: PropTypes.func.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
};

export default Pagination;