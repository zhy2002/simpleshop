<%@include file="../WEB-INF/_header.jspf" %>

<t:page>
    <t:view-create>
        <d:order-form />
    </t:view-create>

    <script>
        <c:import url="/json/${f:urlModelNameFromUrl(pageContext.request.requestURL)}/new" />
    </script>
</t:page>