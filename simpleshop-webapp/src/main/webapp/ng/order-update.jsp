<%@include file="../WEB-INF/_header.jspf" %>


<t:page>
    <t:view-update>
        <d:order-form />
    </t:view-update>

    <script>
        <c:import url="/json/${f:urlModelNameFromUrl(pageContext.request.requestURL)}/${param.modelId}" />
    </script>
</t:page>