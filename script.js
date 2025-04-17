document.addEventListener('DOMContentLoaded', function() {
    // Configura Select2 para o dropdown de exames
    $('.js-exames').select2({
        placeholder: "Selecione ou digite um exame",
        tags: true // Permite adicionar novos exames
    });

    // Define a data atual como padrão
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataSolicitacao').value = hoje;

    
    // Lista de exames adicionados
    const examesAdicionados = [];

    // Adiciona exame à lista
    document.getElementById('adicionarExame').addEventListener('click', function() {
        const selectExame = document.getElementById('exames');
        const exame = selectExame.value;

        if (exame && !examesAdicionados.includes(exame)) {
            examesAdicionados.push(exame);
            atualizarListaExames();
            selectExame.value = '';
            $('.js-exames').val(null).trigger('change');
            atualizarPreview();
        }
    });

    // Remove exame da lista
    function removerExame(index) {
        examesAdicionados.splice(index, 1);
        atualizarListaExames();
        atualizarPreview();
    }

    // Atualiza a lista de exames na interface
    function atualizarListaExames() {
        const divExames = document.getElementById('examesAdicionados');
        divExames.innerHTML = '';

        examesAdicionados.forEach((exame, index) => {
            const divExame = document.createElement('div');
            divExame.className = 'exame-item';
            divExame.innerHTML = `
                <input type="text" value="${exame}" readonly>
                <button onclick="removerExame(${index})">Remover</button>
            `;
            divExames.appendChild(divExame);
        });
    }

    // Atualiza a pré-visualização do PDF
    async function atualizarPreview() {
        const pdfBytes = await gerarPdfBytes();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        document.getElementById('pdfPreview').src = url;
        document.getElementById('imprimirPdf').style.display = 'block';
    }

    // Gera o PDF em bytes
    async function gerarPdfBytes() {
        const { PDFDocument, rgb } = PDFLib;
    
        // Carrega o modelo.pdf existente (coloque o arquivo na mesma pasta ou ajuste o caminho)
        const modeloBytes = await fetch('modelo.pdf').then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(modeloBytes);
    
        // Obtém a primeira página (ajuste se necessário)
        const pages = pdfDoc.getPages();
        const page = pages[0];
    
        // Dados do formulário
        const form = {
            nome: document.getElementById('nome').value,
            dataNascimento: formatarData(document.getElementById('dataNascimento').value),
            nomeMae: document.getElementById('nomeMae').value,
            prontuario: document.getElementById('prontuario').value,
            setorOrigem: document.getElementById('setorOrigem').value,
            numeroLeito: document.getElementById('numeroLeito').value,
            exames: examesAdicionados.join(', '),
            indicacaoClinica: document.getElementById('indicacaoClinica').value,
            dataSolicitacao: formatarData(document.getElementById('dataSolicitacao').value),
            sexo: document.getElementById('sexo').value
        };
    
        // Função para formatar data (DD/MM/AAAA)
        function formatarData(dataISO) {
            if (!dataISO) return '';
            const [ano, mes, dia] = dataISO.split('-');
            return `${dia}/${mes}/${ano}`;
        }
    
        // Coordenadas (X, Y) para cada campo (AJUSTE CONFORME SEU MODELO!)
        const campos = [
            { text: form.nome, x: 138, y: 473, size: 11 }, // Nome
            { text: form.dataNascimento, x: 147.7, y: 458, size: 11 }, // Data de Nascimento
            { text: form.nomeMae, x: 116, y: 445, size: 11 }, // Nome da Mãe
            { text: form.prontuario, x: 70.9, y: 384, size: 11 }, // Prontuário
            { text: form.setorOrigem, x: 170.7, y: 384, size: 11 }, // Setor de Origem
            { text: form.numeroLeito, x: 302.5, y: 384, size: 11 }, // Nº do Leito
            { text: form.exames, x: 44, y: 323, size: 12, maxWidth: 300 }, // Exames
            { text: form.indicacaoClinica, x: 132.8, y: 108.85, size: 11, maxWidth: 300 }, // Indicação Clínica
            { text: form.dataSolicitacao, x: 143, y: 93.9, size: 11 } // Data de Solicitação
        ];
    
        // Insere os textos no PDF
        campos.forEach(campo => {
            if (campo.text) {
                page.drawText(campo.text, {
                    x: campo.x,
                    y: campo.y,
                    size: campo.size || 12,
                    color: rgb(0, 0, 0),
                    maxWidth: campo.maxWidth || 400
                });
            }
        });
    
        if (form.sexo === 'M') {
            page.drawText('X', { x: 308, y: 458, size: 14, color: rgb(0, 0, 0) }); // Masculino
        } else if (form.sexo === 'F') {
            page.drawText('X', { x: 308, y: 445, size: 14, color: rgb(0, 0, 0) }); // Feminino
        }

        return await pdfDoc.save();
    }

    // Atualiza o preview quando os campos mudam
    document.querySelectorAll('input, textarea, select').forEach(element => {
        element.addEventListener('input', atualizarPreview);
    });

    // Botão para gerar e baixar o PDF
    document.getElementById('gerarPdf').addEventListener('click', async function() {
        const pdfBytes = await gerarPdfBytes();
        
        // Obtém os valores do nome e prontuário
        const nome = document.getElementById('nome').value.trim();
        const prontuario = document.getElementById('prontuario').value.trim();
        
        // Cria o nome do arquivo
        let fileName = 'formulario_clinico';
        if (nome) fileName = nome;
        if (prontuario) fileName += `_${prontuario}`;
        fileName += '.pdf';  // Adiciona a extensão
        
        // Remove caracteres inválidos para nome de arquivo
        fileName = fileName.replace(/[\/\\|:*?"<>]/g, '');
        
        saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), fileName);
    });

    // Botão para imprimir o PDF
    document.getElementById('imprimirPdf').addEventListener('click', function() {
        const iframe = document.getElementById('pdfPreview');
        iframe.contentWindow.print();
        const style = document.createElement('style');
        style.innerHTML = `
            @page { size: landscape; margin: 0; }
            body { margin: 0; padding: 0; }
            div { page-break-after: always; }
        `;
        
    });

    // Permite acessar `removerExame` globalmente (para o HTML)
    window.removerExame = removerExame;

    // Atualiza o preview inicial
    atualizarPreview();

    // Controle do Modo Escuro
    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');

    // Verifica preferência do usuário ou armazenamento local
    const savedTheme = localStorage.getItem('theme') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // Aplica o tema salvo
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
        themeLabel.textContent = 'Modo Claro';
    }

    // Alternador de tema
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeLabel.textContent = 'Modo Claro';
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeLabel.textContent = 'Modo Escuro';
        }
    });
});